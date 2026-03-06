import os
from dotenv import load_dotenv
import pandas as pd
import pandas_ta as ta
import numpy as np
from scipy.signal import find_peaks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from vnstock import Vnstock
from google import genai
from google.genai import types
from sklearn.ensemble import RandomForestClassifier
import redis
import pickle

# Load env variables
load_dotenv()

class RateLimitException(Exception):
    pass

class SignalResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    date: str
    price: float
    signal_type: str
    reason: str
    ml_probability: float = 0.0

class BacktestResult(BaseModel):
    win_rate: float
    expected_return: float
    sharpe_ratio: float
    stop_loss_price: float
    max_drawdown: float = 0.0
    cagr: float = 0.0
    equity_curve: List[Dict[str, Any]] = []

class AnalysisResponse(BaseModel):
    symbol: str
    current_state: str
    signals: List[SignalResult]
    backtest: BacktestResult
    sentiment_score: Optional[float] = None
    sentiment_summary: Optional[str] = None

_CACHE = {}

try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    REDIS_AVAILABLE = False

def get_stock_data(symbol: str) -> pd.DataFrame:
    global _CACHE
    if REDIS_AVAILABLE:
        cached_data = redis_client.get(f"stock_data:{symbol}")
        if cached_data:
            return pickle.loads(cached_data)
    else:
        if symbol in _CACHE:
            return _CACHE[symbol].copy()

    # Rate limiting via Redis
    if REDIS_AVAILABLE:
        lock_key = f"fetch_lock:{symbol}"
        if redis_client.get(lock_key):
            raise RateLimitException("Data is being fetched by another process. Please wait.")
        redis_client.set(lock_key, "1", ex=10)
        
        # Global API rate limit token bucket
        if redis_client.get("global_vnstock_limit"):
            raise RateLimitException(f"Global API rate limit active. Please wait to fetch {symbol}.")
        redis_client.set("global_vnstock_limit", "1", ex=2)

    # Fetch 3 years of data (approx 756 trading days)
    end_date = pd.Timestamp.today().strftime('%Y-%m-%d')
    start_date = (pd.Timestamp.today() - pd.DateOffset(years=3)).strftime('%Y-%m-%d')
    try:
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        df = stock.quote.history(start=start_date, end=end_date)
        if df is not None and not df.empty:
            df['time'] = pd.to_datetime(df['time'])
            df.set_index('time', inplace=True)
            
            if REDIS_AVAILABLE:
                # Cache for 1 hour
                redis_client.set(f"stock_data:{symbol}", pickle.dumps(df), ex=3600)
            else:
                _CACHE[symbol] = df.copy()
            return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
    except SystemExit as e:
        print(f"SystemExit caught (likely rate limit) for {symbol}: {e}")
        if REDIS_AVAILABLE:
            redis_client.set("global_vnstock_limit", "1", ex=60) # Backoff for 60s
        raise RateLimitException("vnstock API rate limit exceeded. Please wait 1 minute and try again.")
    finally:
        if REDIS_AVAILABLE:
            redis_client.delete(f"fetch_lock:{symbol}")
            
    return pd.DataFrame()

def process_signals(df: pd.DataFrame) -> List[SignalResult]:
    signals = []
    if df.empty or len(df) < 50:
        return signals

    # Step 1: Smooth price series using 5-day SMA to filter noise
    df['smoothed_close'] = df['close'].rolling(window=5, min_periods=1).mean()

    # Step 2: Use scipy.signal.find_peaks to find macro bottoms on inverted prices
    inverted_prices = -df['smoothed_close'].values
    peaks, _ = find_peaks(inverted_prices, prominence=0.05 * df['smoothed_close'].mean(), distance=20)
    
    # Store bottom points
    df['is_macro_bottom'] = False
    df.iloc[peaks, df.columns.get_loc('is_macro_bottom')] = True

    # Step 3: Confluence filters
    # Calculate RSI
    df['RSI'] = ta.rsi(df['close'], length=14)
    # Calculate MACD
    macd = ta.macd(df['close'], fast=12, slow=26, signal=9)
    if macd is not None:
        df = pd.concat([df, macd], axis=1)
        # MACD Crossover below 0: MACD line crosses above Signal line, and both are < 0
        macd_line = getattr(macd, 'MACD_12_26_9', macd.iloc[:, 0])
        macd_signal = getattr(macd, 'MACDs_12_26_9', macd.iloc[:, 1])
        df['MACD_line'] = macd_line
        df['MACD_signal'] = macd_signal
        
        df['MACD_crossover'] = (df['MACD_line'] > df['MACD_signal']) & \
                               (df['MACD_line'].shift(1) <= df['MACD_signal'].shift(1)) & \
                               (df['MACD_line'] < 0)
    else:
        df['MACD_crossover'] = False

    # SMA 20 Volume for volume spike detection
    df['Volume_SMA_20'] = df['volume'].rolling(window=20).mean()
    df['Volume_Spike'] = df['volume'] > 1.5 * df['Volume_SMA_20']

    # Add Machine Learning Probability
    if len(df) > 100:
        df_ml = df.copy()
        features = ['RSI', 'MACD_line', 'MACD_signal']
        df_ml[features] = df_ml[features].fillna(0)
        # Target: Price is higher 10 days from now
        df_ml['Target'] = (df_ml['close'].shift(-10) > df_ml['close']).astype(int)
        
        train_df = df_ml.iloc[:-10]
        if len(train_df) > 0:
            model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
            model.fit(train_df[features], train_df['Target'])
            df['ml_probability'] = model.predict_proba(df_ml[features])[:, 1]
    else:
        df['ml_probability'] = 0.5

    # Calculate RSI Divergence (Simplified 20-day lookback)
    df['RSI_Low_20'] = df['RSI'].rolling(window=20).min()
    df['Price_Low_20'] = df['low'].rolling(window=20).min()
    
    for i in range(len(df)):
        if pd.isna(df['RSI'].iloc[i]):
            continue
            
        # V3 EXACTING STANDARDS: "Đánh Đâu Thắng Đó"
        # 1. MACD crossover must happen strictly below 0
        is_macd_golden_cross = df['MACD_crossover'].iloc[i] and df['MACD_line'].iloc[i] < 0
        
        # 2. Volume Spike: Must be a massive accumulation day (> 2.5x median/SMA volume)
        df.loc[df.index[i], 'Volume_Spike_Strict'] = df['volume'].iloc[i] > 2.5 * df['Volume_SMA_20'].iloc[i]
        
        # 3. RSI Bullish Divergence (Price made a lower low in last 20 days, but RSI made a higher low, and now crossing up)
        # We simplify: Current RSI > 10 days ago, but Current Price < 10 days ago (momentum shifting while price dropped)
        if i >= 10:
            rsi_momentum_positive = df['RSI'].iloc[i] > df['RSI'].iloc[i-10]
            price_divergence = df['close'].iloc[i] < df['close'].iloc[i-10]
            is_bullish_divergence = (rsi_momentum_positive and price_divergence) and df['RSI'].iloc[i] < 45
        else:
            is_bullish_divergence = False
            
        is_macro_bottom = any(df['is_macro_bottom'].iloc[max(0, i-5):i+1])
        
        # Confluence Engine
        if is_macd_golden_cross and (is_bullish_divergence or is_macro_bottom) and df['Volume_Spike_Strict'].iloc[i]:
            ml_prob = df['ml_probability'].iloc[i] if 'ml_probability' in df else 0.5
            
            # 4. The Final ML Filter: Must have > 65% win probability computed by Random Forest Phase
            if ml_prob >= 0.65:
                signals.append(SignalResult(
                    date=df.index[i].strftime('%Y-%m-%d'),
                    price=df['close'].iloc[i],
                    signal_type="STRONG_BUY",
                    reason="V3 Strict Mode: MACD < 0 Cross + Volume > 2.5x + RSI Divergence + ML > 65%",
                    ml_probability=round(float(ml_prob), 2)
                ))

    # Keep only the first signal in a 20-day cluster to avoid duplicate nested trades
    filtered_signals = []
    last_signal_idx = -20
    for sig in signals:
        idx = int(np.where(df.index.strftime('%Y-%m-%d') == sig.date)[0][0])
        if idx - last_signal_idx >= 10:
            filtered_signals.append(sig)
            last_signal_idx = idx

    return filtered_signals

def run_backtest(df: pd.DataFrame, signals: List[SignalResult]) -> BacktestResult:
    # 1.5x ATR Stop-loss
    if 'ATR' not in df:
        df['ATR'] = ta.atr(df['high'], df['low'], df['close'], length=14)
    # Calculate current stop loss for the most recent price if we can
    current_atr = df['ATR'].iloc[-1] if 'ATR' in df and not df['ATR'].isna().all() else df['close'].iloc[-1] * 0.05
    current_stop_loss = df['close'].iloc[-1] - 1.5 * current_atr
    
    if not signals or df.empty:
        return BacktestResult(
            win_rate=0.0, expected_return=0.0, sharpe_ratio=0.0, 
            stop_loss_price=round(current_stop_loss, 2),
            max_drawdown=0.0, cagr=0.0
        )
        
    wins = 0
    total_trades = 0
    returns = []
    
    # Portfolio tracking
    equity_array = np.full(len(df), 100.0)
    current_flat_equity = 100.0
    last_trade_exit_idx = 0
    
    for sig in signals:
        idx_matches = np.where(df.index.strftime('%Y-%m-%d') == sig.date)[0]
        if len(idx_matches) == 0:
            continue
        idx = int(idx_matches[0])
        
        # Skip overlapping trades for portfolio tracking simplicity
        if idx < last_trade_exit_idx:
            continue
            
        # Fill flat equity before trade
        equity_array[last_trade_exit_idx:idx] = current_flat_equity
        
        entry_price = sig.price
        atr = df['ATR'].iloc[idx] if not pd.isna(df['ATR'].iloc[idx]) else entry_price * 0.05
        
        # Dynamic trailing stop initially set
        highest_price_seen = entry_price
        stop_loss = highest_price_seen - 1.5 * atr
        
        trade_max_idx = min(len(df) - 1, idx + 20)
        exit_price = df['close'].iloc[trade_max_idx]
        actual_exit_idx = trade_max_idx
        
        for j in range(idx, trade_max_idx + 1):
            curr_low = df['low'].iloc[j]
            curr_high = df['high'].iloc[j]
            curr_close = df['close'].iloc[j]
            curr_atr = df['ATR'].iloc[j] if not pd.isna(df['ATR'].iloc[j]) else atr
            
            # Record mark-to-market equity
            equity_array[j] = current_flat_equity * (curr_close / entry_price)
            
            # Hit dynamic stop loss
            if curr_low < stop_loss and j > idx:
                exit_price = stop_loss
                actual_exit_idx = j
                equity_array[j] = current_flat_equity * (exit_price / entry_price)
                break
                
            # Upward trailing logic
            if curr_high > highest_price_seen:
                highest_price_seen = curr_high
                new_stop = highest_price_seen - 1.5 * curr_atr
                if new_stop > stop_loss:
                    stop_loss = new_stop
                    
        pct_return = (exit_price - entry_price) / entry_price
        returns.append(pct_return)
        
        current_flat_equity = current_flat_equity * (1 + pct_return)
        last_trade_exit_idx = actual_exit_idx + 1
        
        if pct_return > 0:
            wins += 1
        total_trades += 1
        
    # Fill remaining days
    if last_trade_exit_idx < len(df):
        equity_array[last_trade_exit_idx:] = current_flat_equity
        
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0.0
    expected_return = np.mean(returns) * 100 if returns else 0.0
    sharpe = np.mean(returns) / np.std(returns) if len(returns) > 1 and np.std(returns) > 0 else 0.0
    
    # Portfolio Metrics
    cagr = 0.0
    max_drawdown = 0.0
    
    if len(df) > 1:
        years = len(df) / 252.0 if len(df) > 0 else 3.0
        final_equity = equity_array[-1]
        cagr = ((final_equity / 100.0) ** (1 / years) - 1) * 100
        
        peaks = np.maximum.accumulate(equity_array)
        drawdowns = (peaks - equity_array) / peaks
        max_drawdown = np.max(drawdowns) * 100
        
    equity_curve_list = [{"time": df.index[i].strftime('%Y-%m-%d'), "value": round(float(eq), 2)} for i, eq in enumerate(equity_array)]
    
    return BacktestResult(
        win_rate=round(win_rate, 2),
        expected_return=round(expected_return, 2),
        sharpe_ratio=round(sharpe, 2),
        stop_loss_price=round(current_stop_loss, 2),
        max_drawdown=round(max_drawdown, 2),
        cagr=round(cagr, 2),
        equity_curve=equity_curve_list
    )

def analyze_sentiment(symbol: str) -> dict:
    # Call Gemini 2.5 Flash to get sentiment score
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"score": 0.0, "summary": "API Key missing."}

    client = genai.Client(api_key=api_key)
    prompt = f"Analyze the current market sentiment for Vietnamese stock {symbol}. Provide a Sentiment Score from -1.0 (extremely negative) to 1.0 (extremely positive), and a brief summary. Respond in flat JSON format with exactly 2 keys: 'score' (number) and 'summary' (string)."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        import json
        import re
        text = response.text
        # extract JSON
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            return {
                "score": float(data.get("score", 0.0)),
                "summary": data.get("summary", "No summary provided.")
            }
    except Exception as e:
        print(f"Sentiment analysis failed: {e}")
    
    return {"score": 0.0, "summary": "Failed to analyze sentiment."}

def run_decision_engine(symbol: str) -> AnalysisResponse:
    df = get_stock_data(symbol)
    if df.empty:
        return AnalysisResponse(
            symbol=symbol,
            current_state="NO_DATA",
            signals=[],
            backtest=BacktestResult(win_rate=0.0, expected_return=0.0, sharpe_ratio=0.0, stop_loss_price=0.0)
        )
    
    signals = process_signals(df)
    backtest = run_backtest(df, signals)
    
    # Determine current state
    current_price = df['close'].iloc[-1]
    sma_50 = df['SMA_50'].iloc[-1] if 'SMA_50' in df else current_price
    
    state = "Sideway"
    if current_price > sma_50 * 1.05:
        state = "Uptrend"
    elif current_price < sma_50 * 0.95:
        state = "Downtrend"
        
    if len(df) > 0 and 'is_macro_bottom' in df.columns and any(df['is_macro_bottom'].iloc[-5:]):
        state = "Bottoming"
        
    return AnalysisResponse(
        symbol=symbol,
        current_state=state,
        signals=signals,
        backtest=backtest
    )

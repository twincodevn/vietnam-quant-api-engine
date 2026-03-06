from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from decision_engine import run_decision_engine, analyze_sentiment, get_stock_data, AnalysisResponse, RateLimitException

app = FastAPI(title="Vietnam Quant Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# List of VN30 symbol
VN30_SYMBOLS = [
    "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
    "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB", 
    "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"
]

@app.get("/api/market/symbols", response_model=List[str])
async def get_symbols():
    return VN30_SYMBOLS

@app.get("/api/stock/{symbol}/chart")
async def get_chart_data(symbol: str):
    try:
        df = get_stock_data(symbol)
    except RateLimitException as e:
        raise HTTPException(status_code=429, detail=str(e))
    
    if df.empty:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df['SMA_20'] = df['close'].rolling(window=20).mean()
    df['SMA_50'] = df['close'].rolling(window=50).mean()
    df['SMA_200'] = df['close'].rolling(window=200).mean()
    
    chart_data = []
    for date, row in df.iterrows():
        chart_data.append({
            "time": date.strftime("%Y-%m-%d"),
            "open": float(row['open']),
            "high": float(row['high']),
            "low": float(row['low']),
            "close": float(row['close']),
            "volume": float(row['volume']),
            "sma20": float(row['SMA_20']) if not pd.isna(row['SMA_20']) else None,
            "sma50": float(row['SMA_50']) if not pd.isna(row['SMA_50']) else None,
            "sma200": float(row['SMA_200']) if not pd.isna(row['SMA_200']) else None
        })
    return {"data": chart_data}

@app.get("/api/stock/{symbol}/signals", response_model=AnalysisResponse)
async def get_signals(symbol: str):
    res = run_decision_engine(symbol)
    if res.current_state == "NO_DATA":
        raise HTTPException(status_code=404, detail="Data not found or not enough data")
    return res

@app.get("/api/market/screener")
async def get_market_screener():
    results = []
    # Just take top 10 to avoid excessive initial load times without Redis (Phase 3)
    for sym in VN30_SYMBOLS[:10]:
        try:
            res = run_decision_engine(sym)
            if res.current_state != "NO_DATA":
                results.append({
                    "symbol": sym,
                    "current_state": res.current_state,
                    "win_rate": res.backtest.win_rate,
                    "cagr": res.backtest.cagr,
                    "signal_count": len(res.signals),
                    "latest_signal": res.signals[-1].signal_type if res.signals else "NONE",
                    "ml_prob": getattr(res.signals[-1], 'ml_probability', 0.0) if res.signals else 0.0
                })
        except Exception as e:
            continue
    return {"data": results}

class SentimentResponse(BaseModel):
    score: float
    summary: str

@app.post("/api/stock/{symbol}/sentiment", response_model=SentimentResponse)
async def get_sentiment(symbol: str):
    res = analyze_sentiment(symbol)
    return SentimentResponse(score=res["score"], summary=res["summary"])

class PortfolioRequest(BaseModel):
    tickers: List[str]

@app.post("/api/portfolio/xray")
async def analyze_portfolio(req: PortfolioRequest):
    if not req.tickers:
        raise HTTPException(status_code=400, detail="Must provide at least one ticker")
    
    tickers_str = ", ".join(req.tickers[:10])
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"title": "Error", "roast": "API Key missing.", "risk_score": 100}

    from google import genai
    client = genai.Client(api_key=api_key)
    
    prompt = f"""You are a harsh, sarcastic, but hyper-intelligent Quantitative Hedge Fund Manager from Wall Street. 
    A retail investor just showed you their stock portfolio in the Vietnam stock market (HOSE).
    The portfolio contains: {tickers_str}.
    
    Your task is to "roast" (chê bai hài hước, mỉa mai đau điếng) or brutally praise this portfolio. 
    Review the diversification, the quality of the companies, and the risk.
    Also, assign a Risk Score from 0 to 100, and a catchy Title for this specific investor personality type.
    
    Rules:
    - Language: Vietnamese (use local slang like: đu đỉnh, lái lợn, múa bên trăng, gồng lỗ).
    - Tone: Brutally honest, very funny, slightly condescending but insightful.
    - JSON Format ONLY: {{ "title": "Danh Hiệu", "roast": "Nội dung...", "risk_score": 85 }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        import json, re
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return {"title": "Error", "roast": "Could not parse AI response.", "risk_score": 50}
    except Exception as e:
        return {"title": "Error", "roast": str(e), "risk_score": 50}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

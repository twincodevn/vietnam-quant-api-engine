Navigate to http://localhost:3000

1. **Verify Home Page & Right Panel V2 metrics**: 
- Click on few different symbols like 'TCB' and 'FPT' on the left sidebar.
- Look at the new Equity curve chart loaded under the candlestick chart.
- Look at the RightPanel. Confirm "Max Drawdown" and "CAGR" metrics appear and render properly in the local language string. Wait at least 15 seconds to ensure ML prediction finishes without timing out.

2. **Verify Screener Page**:
- Click on the "Quét Thị Trường (Screener)" button in the top header.
- The browser should navigate to `/screener`.
- Wait about 30 seconds for the ML predictions and backtest to run across the Top 10 VN30 symbols.
- You should see a table render ranking the VN30 symbols with columns for Trend, Signals, ML Probability, Win Rate, and CAGR.
- Take a visual check of this complete process and return back.

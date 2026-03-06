"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { TradingChart } from "@/components/TradingChart"
import { RightPanel } from "@/components/RightPanel"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export default function DashboardPage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [activeSymbol, setActiveSymbol] = useState<string>("FPT")

  const [chartData, setChartData] = useState<any[]>([])
  const [signals, setSignals] = useState<any[]>([])
  const [currentState, setCurrentState] = useState<string>("Fetching...")
  const [backtest, setBacktest] = useState<any>({
    win_rate: 0,
    expected_return: 0,
    sharpe_ratio: 0,
    stop_loss_price: 0,
    max_drawdown: 0,
    cagr: 0,
    equity_curve: []
  })

  const [sentimentScore, setSentimentScore] = useState<number | null>(null)
  const [sentimentSummary, setSentimentSummary] = useState<string | null>(null)
  const [isSentimentLoading, setIsSentimentLoading] = useState(false)

  const [isLoadingSymbols, setIsLoadingSymbols] = useState(true)
  const [isLoadingChart, setIsLoadingChart] = useState(false)

  // Fetch VN30 symbols on mount
  useEffect(() => {
    async function fetchSymbols() {
      try {
        const res = await fetch(`${API_BASE_URL}/market/symbols`)
        if (res.ok) {
          const data = await res.json()
          setSymbols(data)
        }
      } catch (err) {
        console.error("Failed to load symbols", err)
      } finally {
        setIsLoadingSymbols(false)
      }
    }
    fetchSymbols()
  }, [])

  // Fetch chart and signals when activeSymbol changes
  useEffect(() => {
    if (!activeSymbol) return

    async function loadStockData() {
      setIsLoadingChart(true)
      try {
        // Fetch chart data
        const chartRes = await fetch(`${API_BASE_URL}/stock/${activeSymbol}/chart`)
        if (chartRes.ok) {
          const cData = await chartRes.json()
          setChartData(cData.data)
        }

        // Fetch signals/diagnostics
        const signalRes = await fetch(`${API_BASE_URL}/stock/${activeSymbol}/signals`)
        if (signalRes.ok) {
          const sData = await signalRes.json()
          setSignals(sData.signals || [])
          setCurrentState(sData.current_state || "Unknown")
          if (sData.backtest) setBacktest(sData.backtest)
        } else {
          setSignals([])
          setCurrentState("NO_DATA")
        }

        // Reset sentiment
        setSentimentScore(null)
        setSentimentSummary(null)
      } catch (err) {
        console.error("Failed to fetch stock data", err)
      } finally {
        setIsLoadingChart(false)
      }
    }

    loadStockData()
  }, [activeSymbol])

  const handleTriggerSentiment = async () => {
    setIsSentimentLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/stock/${activeSymbol}/sentiment`, {
        method: "POST"
      })
      if (res.ok) {
        const data = await res.json()
        setSentimentScore(data.score)
        setSentimentSummary(data.summary)
      }
    } catch (err) {
      console.error("Sentiment generation failed", err)
    } finally {
      setIsSentimentLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSelectSymbol={setActiveSymbol}
        isLoading={isLoadingSymbols}
      />

      <main className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-950 to-black">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Vietnam Quant <span className="text-indigo-400">Engine</span> <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full ml-2 font-mono">{activeSymbol}</span></h1>
          </div>
          <a href="/screener" className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 text-sm px-4 py-1.5 rounded-full hover:bg-indigo-500 hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Quét Thị Trường
          </a>
        </header>

        <div className="flex-1 relative p-2 flex flex-col">
          {isLoadingChart && (
            <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-slate-500 font-medium">Đang tải dữ liệu lịch sử...</div>
            </div>
          )}

          <TradingChart data={chartData} signals={signals} equityCurve={backtest.equity_curve || []} />
        </div>
      </main>

      <RightPanel
        symbol={activeSymbol}
        currentState={currentState}
        backtest={backtest}
        sentimentScore={sentimentScore}
        sentimentSummary={sentimentSummary}
        isSentimentLoading={isSentimentLoading}
        triggerSentimentAnalysis={handleTriggerSentiment}
      />
    </div>
  )
}

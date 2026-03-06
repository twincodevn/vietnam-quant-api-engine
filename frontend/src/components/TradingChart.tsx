"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, CrosshairMode, ISeriesApi, SeriesMarker, Time } from "lightweight-charts"

interface ChartData {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    sma20: number | null
    sma50: number | null
    sma200: number | null
}

interface Signal {
    date: string
    price: number
    signal_type: string
    reason: string
}

interface TradingChartProps {
    data: ChartData[]
    signals: Signal[]
    equityCurve?: { time: string, value: number }[]
}

export function TradingChart({ data, signals, equityCurve }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const equityChartRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const eqChartInstanceRef = useRef<any>(null)

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#cbd5e1", // slate-300
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: "#334155", // slate-700
            },
            grid: {
                vertLines: { color: "#1e293b" }, // slate-800
                horzLines: { color: "#1e293b" },
            }
        })
        chartRef.current = chart

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350"
        })

        const transformedData = data.map(d => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }))

        candlestickSeries.setData(transformedData)

        // Add EMA lines
        const ema20 = chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.7)', lineWidth: 2, title: 'EMA 20' })
        const ema50 = chart.addLineSeries({ color: 'rgba(234, 179, 8, 0.7)', lineWidth: 2, title: 'EMA 50' })
        const ema200 = chart.addLineSeries({ color: 'rgba(239, 68, 68, 0.7)', lineWidth: 2, title: 'EMA 200' })

        const ema20Data = data.filter(d => d.sma20 !== null).map(d => ({ time: d.time as Time, value: d.sma20 as number }))
        const ema50Data = data.filter(d => d.sma50 !== null).map(d => ({ time: d.time as Time, value: d.sma50 as number }))
        const ema200Data = data.filter(d => d.sma200 !== null).map(d => ({ time: d.time as Time, value: d.sma200 as number }))

        ema20.setData(ema20Data)
        ema50.setData(ema50Data)
        ema200.setData(ema200Data)

        // Add markers
        const chartMarkers: SeriesMarker<Time>[] = signals.map(sig => ({
            time: sig.date as Time,
            position: sig.signal_type.includes("BUY") ? "belowBar" : "aboveBar",
            color: sig.signal_type.includes("BUY") ? "#26a69a" : "#ef5350",
            shape: sig.signal_type.includes("BUY") ? "arrowUp" : "arrowDown",
            text: sig.signal_type,
        }))

        // Sort markers by time as required by lightweight-charts
        chartMarkers.sort((a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime())

        candlestickSeries.setMarkers(chartMarkers)

        // Fit content
        chart.timeScale().fitContent()

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            chart.remove()
        }
    }, [data, signals])

    useEffect(() => {
        if (!equityChartRef.current || !equityCurve || equityCurve.length === 0) return

        const handleResizeEq = () => {
            if (eqChartInstanceRef.current && equityChartRef.current) {
                eqChartInstanceRef.current.applyOptions({ width: equityChartRef.current.clientWidth })
            }
        }

        const eqChart = createChart(equityChartRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#cbd5e1",
            },
            width: equityChartRef.current.clientWidth,
            height: equityChartRef.current.clientHeight,
            crosshair: { mode: CrosshairMode.Normal },
            timeScale: { borderColor: "#334155" },
            grid: {
                vertLines: { color: "#1e293b" },
                horzLines: { color: "#1e293b" },
            }
        })
        eqChartInstanceRef.current = eqChart

        const lineSeries = eqChart.addLineSeries({
            color: '#10b981',
            lineWidth: 2,
        })

        const transformedData = equityCurve.map(d => ({ time: d.time as Time, value: d.value }))
        lineSeries.setData(transformedData)

        eqChart.timeScale().fitContent()

        window.addEventListener("resize", handleResizeEq)

        return () => {
            window.removeEventListener("resize", handleResizeEq)
            eqChart.remove()
        }
    }, [equityCurve])

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900/30" ref={chartContainerRef} style={{ minHeight: "300px" }} />
            {equityCurve && equityCurve.length > 0 && (
                <div className="h-56 relative pt-4 rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900/30">
                    <h3 className="text-xs font-semibold text-slate-400 absolute top-4 left-4 z-10 uppercase tracking-widest">Tăng Trưởng Danh Mục (Equity Curve)</h3>
                    <div className="w-full h-full pt-8" ref={equityChartRef} />
                </div>
            )}
        </div>
    )
}

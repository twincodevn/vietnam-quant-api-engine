"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const API_BASE_URL = process.env.NODE_ENV === 'production' ? "https://vietnam-quant-api-engine.onrender.com/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api")

export default function ScreenerPage() {
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchScreener() {
            try {
                const res = await fetch(`${API_BASE_URL}/market/screener`)
                if (res.ok) {
                    const json = await res.json()
                    setData(json.data)
                }
            } catch (err) {
                console.error("Screener fetch failed", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchScreener()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black p-8 font-sans text-slate-200">
            <div className="max-w-[1400px] mx-auto space-y-8">
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-between items-center py-4"
                >
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        Screener Lọc Cổ Phiếu Toàn Thị Trường
                    </h1>
                    <Link href="/" className="text-indigo-400 hover:text-white font-medium flex items-center gap-2 hover:bg-indigo-600/50 bg-slate-900/50 px-4 py-2 rounded-lg transition-all border border-indigo-500/30 hover:border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Quay lại Biểu đồ
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="border-b border-slate-800/80 pb-4">
                            <CardTitle className="text-slate-100 text-lg uppercase tracking-widest text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Cơ Hội Giao Dịch Gần Nhất (Top 10 VN30)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoading ? (
                                <div className="py-20 text-center text-slate-400 animate-pulse flex flex-col items-center justify-center gap-4">
                                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <div>
                                        Đang quét toàn bộ thị trường... <br />
                                        <span className="text-sm font-light text-slate-500">(Quá trình chạy Machine Learning có thể mất 15-30 giây)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-800">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">Mã Cổ Phiếu</th>
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">Xu Hướng Trend</th>
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">Tín Hiệu (Signal)</th>
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">ML Dự Đoán Thắng</th>
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">Win Rate Lịch Sử</th>
                                                <th className="py-4 px-6 font-medium text-xs uppercase tracking-wider">Biên Lợi Nhuận (CAGR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((row, i) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                                    key={i}
                                                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                                                >
                                                    <td className="py-4 px-6 font-bold text-indigo-400 text-lg group-hover:text-indigo-300">{row.symbol}</td>
                                                    <td className="py-4 px-6">
                                                        <Badge className={
                                                            row.current_state === 'Uptrend' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                row.current_state === 'Downtrend' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                                    'bg-slate-800 text-slate-300 border-slate-700'
                                                        }>
                                                            {row.current_state}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {row.latest_signal === 'STRONG_BUY' ? (
                                                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-400 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">MUA MẠNH</Badge>
                                                        ) : (
                                                            <span className="text-slate-600 font-light italic">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono">
                                                        <span className={row.ml_prob > 0.5 ? "text-emerald-400 font-bold" : "text-amber-500"}>
                                                            {(row.ml_prob * 100).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-slate-300">{row.win_rate}%</td>
                                                    <td className="py-4 px-6 text-emerald-400 font-mono [text-shadow:0_0_10px_rgba(52,211,153,0.2)]">{row.cagr > 0 ? '+' : ''}{row.cagr}%</td>
                                                </motion.tr>
                                            ))}
                                            {data.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                                        Hệ thống không tìm thấy cổ phiếu khả dụng. Gặp lỗi API rate limit từ hệ thống vnstock.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

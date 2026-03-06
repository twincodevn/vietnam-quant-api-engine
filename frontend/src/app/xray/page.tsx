"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRef } from "react"
import html2canvas from "html2canvas"
import { Badge } from "@/components/ui/badge"

const getApiUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return "http://localhost:8000/api";
    }
    return "https://vietnam-quant-api-engine.onrender.com/api";
}
const API_BASE_URL = getApiUrl();

export default function XRayPage() {
    const [inputValue, setInputValue] = useState("");
    const [tickers, setTickers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleAddTicker = () => {
        const val = inputValue.trim().toUpperCase();
        if (val && !tickers.includes(val)) {
            setTickers([...tickers, val]);
        }
        setInputValue("");
    }

    const removeTicker = (t: string) => {
        setTickers(tickers.filter(x => x !== t));
    }

    const analyzePortfolio = async () => {
        if (tickers.length === 0) return;
        setIsLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/portfolio/xray`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tickers })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (error) {
            console.error("Failed to analyze", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsSharing(true);
        try {
            // Un-hide momentarily for html2canvas if needed, but absolute positioning off-screen usually works
            const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `XRay_${tickers.join("_")}.png`;
            link.click();
        } catch (error) {
            console.error("Error generating share card", error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-sans selection:bg-rose-500/30">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 tracking-tight">AI Portfolio X-Ray</h1>
                        <p className="text-slate-400 mt-2 text-lg">Bói danh mục. Chuẩn đoán phong cách. "Chửi" không trượt phát nào.</p>
                    </div>
                    <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2">
                        <span>&larr;</span> Quay lại
                    </a>
                </div>

                {/* Input Area */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4">Nhập mã cổ phiếu bạn đang "gồng"</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTicker()}
                            placeholder="VD: HPG, SSI, NVL..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                        />
                        <button
                            onClick={handleAddTicker}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-medium transition-colors border border-slate-700"
                        >
                            Thêm
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <AnimatePresence>
                            {tickers.map(t => (
                                <motion.div
                                    key={t}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="bg-slate-800 text-rose-200 px-4 py-2 rounded-full flex items-center gap-2 border border-rose-500/30"
                                >
                                    <span className="font-mono font-bold">{t}</span>
                                    <button onClick={() => removeTicker(t)} className="text-slate-500 hover:text-rose-400">&times;</button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/50">
                        <button
                            onClick={analyzePortfolio}
                            disabled={tickers.length === 0 || isLoading}
                            className="w-full bg-gradient-to-r from-rose-600 to-orange-600 disabled:opacity-50 hover:from-rose-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all flex justify-center items-center gap-3 text-lg disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    AI đang soi tài khoản...
                                </>
                            ) : "Bốc Quẻ Danh Mục"}
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-900/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                {/* Score Circular Graph (Simulated) */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-48 h-48 rounded-full border-8 border-rose-500/20 relative">
                                    <div className="absolute inset-0 rounded-full border-8 border-rose-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${result.risk_score}%, 0 ${result.risk_score}%)` }} />
                                    <span className="text-5xl font-black text-rose-500">{result.risk_score}</span>
                                    <span className="text-slate-400 text-sm uppercase tracking-widest mt-1">Độ Rủi Ro</span>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/50 px-3 py-1 text-sm uppercase tracking-widest">Danh Hiệu AI Phong Tặng</Badge>
                                    <h3 className="text-3xl font-bold text-white">{result.title}</h3>
                                    <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <p className="text-lg text-slate-300 leading-relaxed font-light italic">
                                            "{result.roast}"
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleShare}
                                        disabled={isSharing}
                                        className="mt-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 border border-slate-600 hover:border-slate-500"
                                    >
                                        {isSharing ? "Đang tạo ảnh..." : "📸 Tải Ảnh Sống Ảo (PNG)"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Hidden shareable card for html2canvas */}
            {result && (
                <div
                    ref={cardRef}
                    style={{
                        width: '800px',
                        height: '1000px',
                        position: 'absolute',
                        left: '-9999px',
                        top: 0,
                        background: 'linear-gradient(135deg, #0f172a 0%, #000000 100%)',
                        color: 'white',
                        fontFamily: 'sans-serif',
                        padding: '60px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '4px solid #e11d48',
                        borderRadius: '40px',
                        overflow: 'hidden'
                    }}
                >
                    <h2 style={{ color: '#fb7185', fontSize: '24px', letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>Kết quả X-Ray Danh Mục</h2>
                    <h1 style={{ fontSize: '72px', margin: '20px 0', lineHeight: 1.1 }}>{result.title}</h1>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
                        {tickers.map(t => (
                            <span key={t} style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px 20px', borderRadius: '100px', fontSize: '24px', fontWeight: 'bold' }}>
                                {t}
                            </span>
                        ))}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', flex: 1 }}>
                        <p style={{ fontSize: '32px', lineHeight: 1.5, color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>"{result.roast}"</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '80px', fontWeight: 900, color: '#e11d48' }}>{result.risk_score}</p>
                            <p style={{ margin: 0, fontSize: '20px', color: '#94a3b8' }}>RISK SCORE</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Vietnam Quant Engine</p>
                            <p style={{ fontSize: '18px', color: '#64748b', margin: 0 }}>@vnstocks.vercel.app</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

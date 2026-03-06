"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Signal {
    date: string
    price: number
    signal_type: string
    reason: string
}

interface Backtest {
    win_rate: number
    expected_return: number
    sharpe_ratio: number
    stop_loss_price: number
    max_drawdown: number
    cagr: number
}

interface RightPanelProps {
    symbol: string
    currentState: string
    backtest: Backtest
    sentimentScore: number | null
    sentimentSummary: string | null
    isSentimentLoading: boolean
    triggerSentimentAnalysis: () => void
}

export function RightPanel({
    symbol,
    currentState,
    backtest,
    sentimentScore,
    sentimentSummary,
    isSentimentLoading,
    triggerSentimentAnalysis
}: RightPanelProps) {

    const getStateBadge = (state: string) => {
        switch (state) {
            case "Uptrend": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{state}</Badge>
            case "Downtrend": return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">{state}</Badge>
            case "Bottoming": return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">{state}</Badge>
            default: return <Badge className="bg-slate-800 text-slate-300 border-slate-700">{state}</Badge>
        }
    }

    const getSentimentBadge = (score: number | null) => {
        if (score === null) return <Badge className="bg-slate-800 text-slate-400 border-slate-700">Chưa xác định</Badge>
        if (score > 0.3) return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Tích cực ({score})</Badge>
        if (score < -0.3) return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Tiêu cực ({score})</Badge>
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Trung lập ({score})</Badge>
    }

    return (
        <div className="w-80 border-l border-slate-800 bg-slate-900/40 backdrop-blur-xl h-full overflow-y-auto p-5 flex flex-col gap-5 z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.2)] scrollbar-hide">
            <Card className="bg-slate-800/40 border-slate-700/50 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-lg font-bold text-slate-100 tracking-tight">Phân Tích {symbol}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-400">Trạng thái thị trường:</span>
                        {getStateBadge(currentState)}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-md text-slate-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Khảo Sát Khứ Hồi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                        <div className="flex flex-col" title="Tỷ lệ giao dịch có lợi nhuận khi thuật toán ra tín hiệu Mua">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">Tỷ Lệ Thắng</span>
                            <span className="text-lg font-mono text-slate-200">{backtest.win_rate}%</span>
                        </div>
                        <div className="flex flex-col" title="Tỷ suất sinh lời trung bình mỗi giao dịch">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">LN Kỳ Vọng</span>
                            <span className={`text-lg font-mono ${backtest.expected_return > 0 ? "text-emerald-400 [text-shadow:0_0_10px_rgba(52,211,153,0.3)]" : "text-slate-200"}`}>
                                {backtest.expected_return > 0 ? '+' : ''}{backtest.expected_return}%
                            </span>
                        </div>
                        <div className="flex flex-col" title="Chỉ số Sharpe đánh giá mức lợi nhuận trên mỗi đơn vị rủi ro (>1 là tốt)">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">Sharpe</span>
                            <span className="text-lg font-mono text-slate-200">{backtest.sharpe_ratio}</span>
                        </div>
                        <div className="flex flex-col" title="Mức giá cắt lỗ đề xuất dựa trên biên độ giao động (1.5x ATR)">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">Trailing Stop</span>
                            <span className="text-lg font-mono text-rose-400">{backtest.stop_loss_price}</span>
                        </div>
                        <div className="flex flex-col" title="Tỷ lệ sụt giảm tài khoản lớn nhất từ đỉnh (càng thấp càng tốt)">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">Max Drawdown</span>
                            <span className="text-lg font-mono text-amber-400">{backtest.max_drawdown}%</span>
                        </div>
                        <div className="flex flex-col" title="Tốc độ tăng trưởng kép hàng năm của danh mục đầu tư">
                            <span className="text-slate-400 border-b border-dashed border-slate-600 w-fit cursor-help text-xs uppercase tracking-wider mb-1">CAGR Đầu Tư</span>
                            <span className={`text-lg font-mono ${backtest.cagr > 0 ? "text-emerald-400 [text-shadow:0_0_10px_rgba(52,211,153,0.3)]" : "text-slate-200"}`}>
                                {backtest.cagr > 0 ? '+' : ''}{backtest.cagr}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1 bg-gradient-to-br from-slate-900 to-indigo-950/20 border-slate-700/50 shadow-lg flex flex-col backdrop-blur-sm">
                <CardHeader className="pb-2 border-b border-slate-700/50">
                    <CardTitle className="text-md text-slate-100 flex justify-between items-center" title="Trí tuệ nhân tạo Gemini đọc tin tức báo chí để tính điểm tâm lý thị trường">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Gemini AI Sentiment
                        </span>
                        <button
                            onClick={triggerSentimentAnalysis}
                            disabled={isSentimentLoading}
                            className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] flex items-center gap-1"
                        >
                            {isSentimentLoading && <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isSentimentLoading ? "Đang xử lý..." : "Quét Tin Tức"}
                        </button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Chỉ số cảm xúc:</span>
                            {getSentimentBadge(sentimentScore)}
                        </div>
                        {sentimentSummary ? (
                            <div className="text-sm p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-300 font-light leading-relaxed shadow-inner flex-1 overflow-y-auto">
                                <span className="text-indigo-400 font-serif text-xl leading-none">"</span>
                                {sentimentSummary}
                                <span className="text-indigo-400 font-serif text-xl leading-none">"</span>
                            </div>
                        ) : (
                            <div className="text-sm p-4 bg-slate-950/30 border border-slate-800/50 rounded-lg text-slate-500 italic text-center flex-1 flex items-center justify-center">
                                Nhấn "Quét Tin Tức" để Gemini thu thập và phân tích thị trường
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { cn } from "@/lib/utils"

interface SidebarProps {
    symbols: string[]
    activeSymbol: string
    onSelectSymbol: (symbol: string) => void
    isLoading?: boolean
}

export function Sidebar({ symbols, activeSymbol, onSelectSymbol, isLoading }: SidebarProps) {
    return (
        <div className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl h-full overflow-y-auto flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/50">
                <h2 className="font-bold text-sm tracking-widest text-slate-400 uppercase">CỔ PHIẾU VN30</h2>
            </div>
            <div className="flex-1 py-2">
                {isLoading ? (
                    <div className="p-4 text-sm text-slate-500">Đang tải mã cổ phiếu...</div>
                ) : (
                    <ul className="space-y-1 px-2">
                        {symbols.map((sym) => (
                            <li key={sym}>
                                <button
                                    onClick={() => onSelectSymbol(sym)}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-between group",
                                        activeSymbol === sym
                                            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                                    )}
                                >
                                    <span>{sym}</span>
                                    {activeSymbol === sym && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

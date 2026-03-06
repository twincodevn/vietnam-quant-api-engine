import React from 'react';

interface SignalCardProps {
    symbol: string;
    mlProb: number;
    winRate: number;
    expectedReturn: number;
    date: string;
}

export const SignalCard = React.forwardRef<HTMLDivElement, SignalCardProps>(
    ({ symbol, mlProb, winRate, expectedReturn, date }, ref) => {
        return (
            <div
                ref={ref}
                style={{
                    // Hardcoded dimensions for a social media friendly card
                    width: '600px',
                    height: '800px',
                    position: 'absolute',
                    left: '-9999px', // Hide it off-screen
                    top: 0,
                    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    padding: '40px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '24px',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Grid Background */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.1,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    zIndex: 0
                }} />

                {/* Header */}
                <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '64px', fontWeight: 800, letterSpacing: '-2px', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {symbol}
                        </h1>
                        <p style={{ margin: '8px 0 0 0', fontSize: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '4px' }}>Tín Hiệu Đột Phá</p>
                    </div>
                    <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '12px 24px', borderRadius: '100px', fontSize: '24px', fontWeight: 'bold', border: '1px solid rgba(74, 222, 128, 0.5)', textShadow: '0 0 10px rgba(74, 222, 128, 0.5)' }}>
                        STRONG BUY
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: 'auto', marginBottom: '40px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '18px', marginBottom: '8px' }}>Xác Suất Thắng (AI)</p>
                        <p style={{ margin: 0, fontSize: '48px', fontWeight: 700, color: '#f8fafc' }}>{(mlProb * 100).toFixed(1)}<span style={{ fontSize: '24px', color: '#64748b' }}>%</span></p>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '18px', marginBottom: '8px' }}>Kỳ Vọng Lợi Nhuận</p>
                        <p style={{ margin: 0, fontSize: '48px', fontWeight: 700, color: '#4ade80' }}>+{expectedReturn.toFixed(2)}<span style={{ fontSize: '24px', color: '#64748b' }}>%</span></p>
                    </div>
                    <div style={{ gridColumn: 'span 2', background: 'rgba(15, 23, 42, 0.6)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '18px', marginBottom: '8px' }}>Win Rate Lịch Sử (3 Năm)</p>
                        <p style={{ margin: 0, fontSize: '48px', fontWeight: 700, color: '#f8fafc' }}>{winRate.toFixed(1)}<span style={{ fontSize: '24px', color: '#64748b' }}>%</span></p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
                    <div>
                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '20px', fontWeight: 600 }}>Vietnam Quant Engine</p>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>AI-Powered Trading System • {date}</p>
                    </div>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'black', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ margin: 0, color: 'white', fontSize: '10px', textAlign: 'center' }}>Scan to<br />Analyze</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

SignalCard.displayName = 'SignalCard';

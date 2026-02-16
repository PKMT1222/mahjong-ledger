'use client';

import Link from 'next/link';

export default function DesignPreview() {
  const players = [
    { name: '陳大文', color: '#0D9488', score: 240, initial: '陳' },
    { name: '李小明', color: '#7C3AED', score: -80, initial: '李' },
    { name: '張小華', color: '#EA580C', score: -80, initial: '張' },
    { name: '王大偉', color: '#0891B2', score: -80, initial: '王' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="app-header" style={{ 
        background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        color: 'white',
        padding: '16px 24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🀄 設計預覽</h1>
          <Link href="/" className="text-white hover:opacity-80">返回</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Primary Button */}
        <section>
          <h2 className="section-title">按鈕樣式</h2>
          <div className="space-y-3">
            <button className="btn btn-primary w-full">
              <span>🀄</span> 新增對局
            </button>
            <div className="flex gap-2">
              <button className="btn btn-secondary flex-1">取消</button>
              <button className="btn btn-danger flex-1">刪除</button>
            </div>
            <button className="btn btn-ghost">返回主頁</button>
          </div>
        </section>

        {/* Score Display */}
        <section>
          <h2 className="section-title">分數顯示</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card" style={{ background: 'var(--color-bg-surface)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>+240</div>
              <div className="stat-label" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>目前得分</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--color-bg-surface)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626' }}>-80</div>
              <div className="stat-label" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>目前失分</div>
            </div>
          </div>
        </section>

        {/* Player Cards */}
        <section>
          <h2 className="section-title">玩家卡片</h2>
          <div className="space-y-2">
            {players.map((player, i) => (
              <div 
                key={i}
                className="player-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: 'var(--color-bg-surface)',
                  borderRadius: 10,
                  border: i === 0 ? '2px solid #0D9488' : '2px solid transparent',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div 
                  className="player-avatar"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: player.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'white'
                  }}
                >
                  {player.initial}
                </div>
                <div className="player-info" style={{ flex: 1 }}>
                  <div className="player-name" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{player.name}</div>
                  <div className="player-meta" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {i === 0 ? '莊家 · 3連莊' : '閒家'}
                  </div>
                </div>
                <div className="score" style={{ 
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: player.score > 0 ? '#059669' : '#DC2626'
                }}>
                  {player.score > 0 ? '+' : ''}{player.score}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Game Card */}
        <section>
          <h2 className="section-title">遊戲卡片</h2>
          <div className="game-card" style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="game-card-title" style={{ fontWeight: 700, fontSize: '1.125rem' }}>週末大戰</h3>
                <p className="game-card-meta" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  香港麻雀 · 東圈 · 第3局
                </p>
              </div>
              <button className="delete-btn" style={{ color: 'var(--color-text-muted)' }}>🗑️</button>
            </div>
            <div className="flex items-center gap-2">
              {players.map((p, i) => (
                <div 
                  key={i}
                  className="player-avatar-small"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'white',
                    border: '2px solid white',
                    marginLeft: i > 0 ? -8 : 0
                  }}
                >
                  {p.initial}
                </div>
              ))}
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                +8 more
              </span>
            </div>
          </div>
        </section>

        {/* Tab Bar */}
        <section>
          <h2 className="section-title">標籤欄</h2>
          <div className="tab-bar" style={{
            display: 'flex',
            background: 'var(--color-bg-surface)',
            borderRadius: 10,
            padding: 4,
            gap: 4
          }}>
            {['記分', '紀錄', '統計'].map((tab, i) => (
              <button 
                key={tab}
                className="tab"
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: i === 0 ? '#0D9488' : 'transparent',
                  color: i === 0 ? 'white' : 'var(--color-text-secondary)',
                  boxShadow: i === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {/* Chips */}
        <section>
          <h2 className="section-title">番數選擇</h2>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                className="chip"
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: n === 3 ? '#0D9488' : '#F1F5F9',
                  color: n === 3 ? 'white' : 'var(--color-text-secondary)'
                }}
              >
                {n}番
              </button>
            ))}
          </div>
        </section>

        {/* FAB */}
        <div className="fixed bottom-6 right-6">
          <button 
            className="fab"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}
          >
            +
          </button>
        </div>
      </main>
    </div>
  );
}

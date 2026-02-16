'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Player } from '@/types';

export default function Home() {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'stats'>('home');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [playersRes, gamesRes, statsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/games'),
        fetch('/api/stats')
      ]);
      
      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(Array.isArray(data) ? data : []);
      }
      
      if (gamesRes.ok) {
        const data = await gamesRes.json();
        setGames(Array.isArray(data) ? data : []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
    }
  }

  async function deleteGame(id: number, name: string, isActive: boolean = false) {
    const message = isActive 
      ? `確定要刪除進行中對局 "${name}" 嗎？\n\n⚠️ 警告：此對局尚未結束，刪除後所有進度將會遺失！`
      : `確定要刪除牌局 "${name}" 嗎？`;
    
    if (!confirm(message)) return;
    
    try {
      const res = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        alert('✅ ' + t('deleteGame') + t('completed'));
      } else {
        const error = await res.json();
        alert('❌ ' + t('error') + ': ' + (error.error || t('unknownError')));
      }
    } catch (error: any) {
      alert('❌ ' + t('error') + ': ' + error.message);
    }
  }

  function calculateWinRate(playerId: number) {
    if (!stats || !stats.playerStats) return 0;
    const playerStat = stats.playerStats.find((s: any) => s.player_id === playerId);
    if (!playerStat || playerStat.games_played === 0) return 0;
    return Math.round((playerStat.wins / playerStat.games_played) * 100);
  }

  function calculateProfit(playerId: number) {
    if (!stats || !stats.playerStats) return 0;
    const playerStat = stats.playerStats.find((s: any) => s.player_id === playerId);
    return playerStat?.total_score || 0;
  }

  const variantNames: { [key: string]: string } = {
    hongkong: '香港麻雀',
    taiwan: '台灣麻將',
    japanese: '日本麻雀',
    'hk-taiwan': '港式台灣',
    paoma: '跑馬仔',
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="app-header p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">🇭🇰 {t('appTitle')}</h1>
            <div className="flex items-center gap-2">
              <Link 
                href="/settings" 
                className="text-xs px-3 py-1 rounded"
                style={{ backgroundColor: 'var(--color-primary-dark)' }}
              >
                ⚙️
              </Link>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-primary-dark)' }}>
            {[
              { id: 'home', label: t('home'), icon: '🏠' },
              { id: 'history', label: t('history'), icon: '📜' },
              { id: 'stats', label: t('statistics'), icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Quick Start */}
            <Link 
              href="/new-game"
              className="block w-full py-4 rounded-lg font-bold text-lg shadow-lg text-center transition-all hover:transform hover:-translate-y-0.5"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                color: 'white',
              }}
            >
              🀄 {t('newGame')}
            </Link>

            {/* Active Games */}
            {games.filter(g => g.status === 'active').length > 0 && (
              <div className="app-card p-4">
                <h2 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                  {t('active')} {t('games')}
                </h2>
                <div className="space-y-2">
                  {games.filter(g => g.status === 'active').map(game => (
                    <div 
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg group"
                      style={{ 
                        backgroundColor: 'var(--color-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Link 
                        href={`/game/${game.id}`}
                        className="flex-1"
                      >
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{game.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {t('round')} {game.current_round} · {variantNames[game.variant] || game.variant}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/game/${game.id}`}
                          style={{ color: 'var(--color-success)' }}
                        >
                          {t('active')} →
                        </Link>
                        <button
                          onClick={() => deleteGame(game.id, game.name, true)}
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 transition"
                          style={{ color: 'var(--color-danger)' }}
                          title={t('deleteGame')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Overview */}
            <div className="app-card p-4">
              <h2 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                {t('players')} ({players.length})
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {players.slice(0, 8).map((p, i) => (
                  <div 
                    key={p.id} 
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ 
                        backgroundColor: ['var(--color-primary)', '#3b82f6', 'var(--color-success)', 'var(--color-warning)'][i % 4]
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {calculateWinRate(p.id)}% {t('winRate')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: games.length, label: t('totalGames'), color: 'var(--color-primary)' },
                { value: games.filter(g => g.status === 'active').length, label: t('activeGames'), color: 'var(--color-success)' },
                { value: players.length, label: t('players'), color: '#3b82f6' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="app-card p-3 text-center"
                >
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t('history')}</h2>
              <select 
                className="text-sm rounded px-2 py-1 app-input"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <option>全部規則</option>
                <option>香港麻雀</option>
                <option>台灣麻將</option>
              </select>
            </div>

            <div className="space-y-3">
              {games.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>暫無歷史紀錄</p>
              ) : (
                games.map(game => (
                  <div key={game.id} className="app-card p-4">
                    <div className="flex items-start justify-between">
                      <Link href={`/game/${game.id}`} className="flex-1">
                        <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>{game.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(game.created_at).toLocaleDateString('zh-HK')} · 
                          {variantNames[game.variant] || game.variant}
                        </p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {game.players?.slice(0, 4).map((p: any) => (
                            <span 
                              key={p.id} 
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: p.final_score > 0 ? 'rgba(22, 163, 74, 0.1)' : p.final_score < 0 ? 'rgba(220, 38, 38, 0.1)' : 'var(--color-secondary)',
                                color: p.final_score > 0 ? 'var(--color-success)' : p.final_score < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                              }}
                            >
                              {p.name} {p.final_score > 0 ? '+' : ''}{p.final_score}
                            </span>
                          ))}
                        </div>
                      </Link>
                      <div className="flex flex-col items-end gap-2">
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: game.status === 'active' ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-secondary)',
                            color: game.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)',
                          }}
                        >
                          {game.status === 'active' ? t('active') : t('completed')}
                        </span>
                        <button
                          onClick={() => deleteGame(game.id, game.name, game.status === 'active')}
                          className="text-xs hover:underline"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          {t('deleteGame')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{t('statistics')}</h2>
            
            {players.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>暫無數據</p>
            ) : (
              <div className="space-y-3">
                {players
                  .sort((a, b) => calculateProfit(b.id) - calculateProfit(a.id))
                  .map((player, index) => {
                    const profit = calculateProfit(player.id);
                    const winRate = calculateWinRate(player.id);
                    const gamesPlayed = stats?.playerStats?.find((s: any) => s.player_id === player.id)?.games_played || 0;
                    
                    return (
                      <div key={player.id} className="app-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•'}
                            </span>
                            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{player.name}</span>
                          </div>
                          <span 
                            className="text-xl font-bold"
                            style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                          >
                            {profit > 0 ? '+' : ''}{profit}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { value: gamesPlayed, label: '對局數' },
                            { value: winRate + '%', label: t('winRate') },
                            { value: player.wins || 0, label: '食糊' },
                          ].map((stat, i) => (
                            <div 
                              key={i}
                              className="rounded p-2"
                              style={{ backgroundColor: 'var(--color-secondary)' }}
                            >
                              <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Overall Stats */}
            {stats && (
              <div className="app-card p-4">
                <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>整體統計</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="text-center p-3 rounded"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  >
                    <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{stats.totalGames || 0}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>總對局數</p>
                  </div>
                  <div 
                    className="text-center p-3 rounded"
                    style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)' }}
                  >
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.totalRounds || 0}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>總局數</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

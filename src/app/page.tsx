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

  // Player colors for avatars
  const playerColors = ['#0D9488', '#7C3AED', '#EA580C', '#0891B2'];

  return (
    <div className="min-h-screen pb-8" style={{ background: '#F8FAFC' }}>
      {/* Header - New Teal Design */}
      <header className="p-4" style={{ 
        background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        color: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>🀄</span> {t('appTitle')}
            </h1>
            <div className="flex items-center gap-2">
              <Link 
                href="/design-preview" 
                className="text-xs px-3 py-2 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                title="設計預覽"
              >
                🎨
              </Link>
              <Link 
                href="/settings" 
                className="text-xs px-3 py-2 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
              >
                ⚙️
              </Link>
            </div>
          </div>
          
          {/* Navigation - Modern Tab Bar */}
          <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}>
            {[
              { id: 'home', label: t('home'), icon: '🏠', href: null },
              { id: 'history', label: t('history'), icon: '📜', href: null },
              { id: 'stats', label: t('statistics'), icon: '📊', href: '/stats' },
            ].map(tab => (
              tab.href ? (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: activeTab === tab.id ? '#0D9488' : 'transparent',
                    color: 'white',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Quick Start - Modern FAB-style Button */}
            <Link 
              href="/new-game"
              className="block w-full py-4 rounded-2xl font-bold text-lg text-center transition-all hover:transform hover:-translate-y-1 hover:shadow-xl active:transform active:translate-y-0 active:scale-[0.98]"
              style={{ 
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">🀄</span>
                <span>{t('newGame')}</span>
              </span>
            </Link>

            {/* Active Games - Modern Card Design */}
            {games.filter(g => g.status === 'active').length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-md" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <h2 className="font-bold mb-3 text-slate-800 text-sm uppercase tracking-wide">
                  {t('active')} {t('games')}
                </h2>
                <div className="space-y-3">
                  {games.filter(g => g.status === 'active').map(game => (
                    <div 
                      key={game.id}
                      className="group relative overflow-hidden rounded-xl transition-all hover:shadow-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%)',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <Link 
                        href={`/game/${game.id}`}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-lg">{game.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                              {variantNames[game.variant] || game.variant}
                            </span>
                            <span className="text-xs text-slate-500">
                              第 {game.current_round} 局
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-teal-600">
                            進行中 →
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={() => deleteGame(game.id, game.name, true)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-red-50"
                        style={{ color: '#DC2626' }}
                        title={t('deleteGame')}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Overview - Modern Design */}
            <div className="bg-white rounded-2xl p-4 shadow-md" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h2 className="font-bold mb-3 text-slate-800 text-sm uppercase tracking-wide">
                {t('players')} <span className="text-slate-400 font-normal">({players.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {players.slice(0, 8).map((p, i) => (
                  <div 
                    key={p.id} 
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: playerColors[i % 4] }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        勝率 {calculateWinRate(p.id)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats - Modern Stat Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: games.length, label: t('totalGames'), color: '#0D9488', bgColor: '#F0FDFA' },
                { value: games.filter(g => g.status === 'active').length, label: t('activeGames'), color: '#059669', bgColor: '#D1FAE5' },
                { value: players.length, label: t('players'), color: '#7C3AED', bgColor: '#F3E8FF' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="rounded-2xl p-4 text-center transition-all hover:shadow-lg"
                  style={{ backgroundColor: stat.bgColor, border: `1px solid ${stat.color}20` }}
                >
                  <p className="text-3xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs font-medium mt-1" style={{ color: stat.color, opacity: 0.8 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB - Modern Design */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{t('history')}</h2>
              <select 
                className="text-sm rounded-xl px-3 py-2 border-2 border-slate-200 focus:border-teal-500 focus:outline-none bg-white"
              >
                <option>全部規則</option>
                <option>香港麻雀</option>
                <option>台灣麻將</option>
              </select>
            </div>

            <div className="space-y-3">
              {games.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                  <p className="text-4xl mb-3">📜</p>
                  <p className="text-slate-500">暫無歷史紀錄</p>
                </div>
              ) : (
                games.map(game => (
                  <div key={game.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <Link href={`/game/${game.id}`} className="flex-1">
                        <h3 className="font-bold text-slate-800">{game.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(game.created_at).toLocaleDateString('zh-HK')} · 
                          <span className="ml-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                            {variantNames[game.variant] || game.variant}
                          </span>
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {game.players?.slice(0, 4).map((p: any) => (
                            <span 
                              key={p.id} 
                              className="text-xs px-3 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: p.final_score > 0 ? '#D1FAE5' : p.final_score < 0 ? '#FEE2E2' : '#F1F5F9',
                                color: p.final_score > 0 ? '#059669' : p.final_score < 0 ? '#DC2626' : '#64748B',
                              }}
                            >
                              {p.name} {p.final_score > 0 ? '+' : ''}{p.final_score}
                            </span>
                          ))}
                        </div>
                      </Link>
                      <div className="flex flex-col items-end gap-2">
                        <span 
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: game.status === 'active' ? '#D1FAE5' : '#F1F5F9',
                            color: game.status === 'active' ? '#059669' : '#64748B'
                          }}
                        >
                          {game.status === 'active' ? t('active') : t('completed')}
                        </span>
                        <button
                          onClick={() => deleteGame(game.id, game.name, game.status === 'active')}
                          className="text-xs px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors font-medium"
                          style={{ color: '#DC2626' }}
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

        {/* STATS TAB - Modern Design */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">{t('statistics')}</h2>
            
            {players.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-500">暫無數據</p>
              </div>
            ) : (
              <div className="space-y-3">
                {players
                  .sort((a, b) => calculateProfit(b.id) - calculateProfit(a.id))
                  .map((player, index) => {
                    const profit = calculateProfit(player.id);
                    const winRate = calculateWinRate(player.id);
                    const gamesPlayed = stats?.playerStats?.find((s: any) => s.player_id === player.id)?.games_played || 0;
                    
                    return (
                      <div key={player.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•'}
                            </span>
                            <div>
                              <span className="font-bold text-lg text-slate-800 block">{player.name}</span>
                              <span className="text-xs text-slate-500">排名 #{index + 1}</span>
                            </div>
                          </div>
                          <span 
                            className="text-2xl font-extrabold"
                            style={{ color: profit >= 0 ? '#059669' : '#DC2626' }}
                          >
                            {profit > 0 ? '+' : ''}{profit}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { value: gamesPlayed, label: '對局數', color: '#0D9488' },
                            { value: winRate + '%', label: t('winRate'), color: '#7C3AED' },
                            { value: player.wins || 0, label: '食糊', color: '#EA580C' },
                          ].map((stat, i) => (
                            <div 
                              key={i}
                              className="rounded-xl p-3"
                              style={{ backgroundColor: `${stat.color}15` }}
                            >
                              <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Overall Stats - Modern */}
            {stats && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold mb-4 text-slate-800">整體統計</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="text-center p-4 rounded-xl"
                    style={{ backgroundColor: '#F0FDFA', border: '1px solid #0D948820' }}
                  >
                    <p className="text-2xl font-bold text-teal-600">{stats.totalGames || 0}</p>
                    <p className="text-xs font-medium text-teal-600 opacity-70">總對局數</p>
                  </div>
                  <div 
                    className="text-center p-4 rounded-xl"
                    style={{ backgroundColor: '#F3E8FF', border: '1px solid #7C3AED20' }}
                  >
                    <p className="text-2xl font-bold text-purple-600">{stats.totalRounds || 0}</p>
                    <p className="text-xs font-medium text-purple-600 opacity-70">總局數</p>
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

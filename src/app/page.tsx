'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Player } from '@/types';
import { AnimatedButton, AnimatedCard, IconButton, FadeIn } from '@/components/AnimatedElements';

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'stats'>('home');
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

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
    
    // Start delete animation
    setDeletingGameId(id);
    
    // Wait for animation to complete before actually deleting
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchData();
          setDeletingGameId(null);
          // Show toast notification instead of alert
          showToast('✅ 對局已刪除');
        } else {
          const error = await res.json();
          setDeletingGameId(null);
          alert('❌ 刪除失敗: ' + (error.error || 'Unknown error'));
        }
      } catch (error: any) {
        setDeletingGameId(null);
        alert('❌ 刪除失敗: ' + error.message);
      }
    }, 300);
  }

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 2000);
  }, []);

  // Calculate win rate
  function calculateWinRate(playerId: number) {
    if (!stats || !stats.playerStats) return 0;
    const playerStat = stats.playerStats.find((s: any) => s.player_id === playerId);
    if (!playerStat || playerStat.games_played === 0) return 0;
    return Math.round((playerStat.wins / playerStat.games_played) * 100);
  }

  // Calculate total profit/loss
  function calculateProfit(playerId: number) {
    if (!stats || !stats.playerStats) return 0;
    const playerStat = stats.playerStats.find((s: any) => s.player_id === playerId);
    return playerStat?.total_score || 0;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">🇭🇰 麻雀記帳</h1>
            <div className="flex items-center gap-2">
              <Link href="/settings" className="text-xs bg-red-800 px-3 py-1 rounded">
                ⚙️
              </Link>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex bg-red-800 rounded-lg overflow-hidden">
            {[
              { id: 'home', label: '主頁', icon: '🏠' },
              { id: 'history', label: '歷史', icon: '📜' },
              { id: 'stats', label: '統計', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 tab-press transition-all duration-150 ${
                  activeTab === tab.id ? 'bg-red-600' : 'hover:bg-red-700/50'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
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
              className="block w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-lg font-bold text-lg shadow-lg text-center btn-ripple"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              🀄 新增對局
            </Link>

            {/* Active Games */}
            {games.filter(g => g.status === 'active').length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-bold text-gray-800 mb-3">進行中對局</h2>
                <div className="space-y-2">
                  {games.filter(g => g.status === 'active').map((game, index) => (
                    <FadeIn key={game.id} delay={index * 50}>
                      <AnimatedCard
                        isDeleting={deletingGameId === game.id}
                        deleteDirection="right"
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg group"
                      >
                        <Link 
                          href={`/game/${game.id}`}
                          className="flex-1"
                        >
                          <p className="font-medium">{game.name}</p>
                          <p className="text-xs text-gray-500">第{game.current_round}局 · {game.variant === 'hongkong' ? '香港' : game.variant === 'taiwan' ? '台灣' : game.variant === 'japanese' ? '日本' : game.variant}</p>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/game/${game.id}`}
                            className="text-green-600 btn-press inline-block"
                          >
                            進行中 →
                          </Link>
                          <IconButton
                            onClick={() => deleteGame(game.id, game.name, true)}
                            variant="delete"
                            className="opacity-0 group-hover:opacity-100"
                            title="刪除對局"
                          >
                            🗑️
                          </IconButton>
                        </div>
                      </AnimatedCard>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}

            {/* Player Overview */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-800 mb-3">玩家一覽 ({players.length})</h2>
              <div className="grid grid-cols-2 gap-2">
                {players.slice(0, 8).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'][i % 4]
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{calculateWinRate(p.id)}% 勝率</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{games.length}</p>
                <p className="text-xs text-gray-500">總對局</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{games.filter(g => g.status === 'active').length}</p>
                <p className="text-xs text-gray-500">進行中</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{players.length}</p>
                <p className="text-xs text-gray-500">玩家數</p>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">歷史紀錄</h2>
              <select className="text-sm border rounded px-2 py-1">
                <option>全部規則</option>
                <option>香港麻雀</option>
                <option>台灣麻將</option>
              </select>
            </div>

            <div className="space-y-3">
              {games.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暫無歷史紀錄</p>
              ) : (
                games.map((game, index) => (
                  <FadeIn key={game.id} delay={index * 30}>
                    <AnimatedCard
                      isDeleting={deletingGameId === game.id}
                      deleteDirection="right"
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex items-start justify-between">
                        <Link href={`/game/${game.id}`} className="flex-1">
                          <h3 className="font-bold">{game.name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(game.created_at).toLocaleDateString('zh-HK')} · 
                            {game.variant === 'hongkong' ? '香港麻雀' : game.variant}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {game.players?.slice(0, 4).map((p: any) => (
                              <span key={p.id} className={`text-xs px-2 py-0.5 rounded ${
                                p.final_score > 0 ? 'bg-green-100 text-green-700' : 
                                p.final_score < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                              }`}>
                                {p.name} {p.final_score > 0 ? '+' : ''}{p.final_score}
                              </span>
                            ))}
                          </div>
                        </Link>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            game.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                          }`}>
                            {game.status === 'active' ? '進行中' : '已完成'}
                          </span>
                          <button
                            onClick={() => deleteGame(game.id, game.name, game.status === 'active')}
                            className="text-red-400 hover:text-red-600 text-xs btn-press"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </AnimatedCard>
                  </FadeIn>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">玩家統計</h2>
            
            {players.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暫無數據</p>
            ) : (
              <div className="space-y-3">
                {players
                  .sort((a, b) => calculateProfit(b.id) - calculateProfit(a.id))
                  .map((player, index) => {
                    const profit = calculateProfit(player.id);
                    const winRate = calculateWinRate(player.id);
                    const gamesPlayed = stats?.playerStats?.find((s: any) => s.player_id === player.id)?.games_played || 0;
                    
                    return (
                      <div key={player.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•'}
                            </span>
                            <span className="font-bold text-lg">{player.name}</span>
                          </div>
                          <span className={`text-xl font-bold ${profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {profit > 0 ? '+' : ''}{profit}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-lg font-bold">{gamesPlayed}</p>
                            <p className="text-xs text-gray-500">對局數</p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-lg font-bold">{winRate}%</p>
                            <p className="text-xs text-gray-500">勝率</p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-lg font-bold">{player.wins || 0}</p>
                            <p className="text-xs text-gray-500">食糊</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Overall Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold mb-3">整體統計</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalGames || 0}</p>
                    <p className="text-xs text-gray-600">總對局數</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">{stats.totalRounds || 0}</p>
                    <p className="text-xs text-gray-600">總局數</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Toast Notification */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast.message}
        </div>
      </div>
    </div>
  );
}

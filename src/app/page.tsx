'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameVariant, Player } from '@/types';

const VARIANTS: { id: GameVariant; name: string; emoji: string; desc: string }[] = [
  { id: 'taiwan', name: '台灣麻將', emoji: '🀄', desc: '經典台灣16張' },
  { id: 'japanese', name: '日本麻雀', emoji: '🎌', desc: '立直/日本規則' },
  { id: 'hongkong', name: '香港麻雀', emoji: '🇭🇰', desc: '港式13張' },
  { id: 'hk-taiwan', name: '港式台灣', emoji: '🎋', desc: '混合規則' },
  { id: 'paoma', name: '跑馬仔', emoji: '🐎', desc: '碰槓牌/買馬' },
];

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  
  // New game form
  const [newGameName, setNewGameName] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('taiwan');
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [playersRes, gamesRes] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/games')
    ]);
    if (playersRes.ok) setPlayers(await playersRes.json());
    if (gamesRes.ok) setGames(await gamesRes.json());
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlayerName })
    });
    if (res.ok) {
      setNewPlayerName('');
      setShowNewPlayer(false);
      fetchData();
    }
  }

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    if (selectedPlayers.length < 3) {
      alert('Need at least 3 players');
      return;
    }
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newGameName, 
        variant: selectedVariant,
        playerIds: selectedPlayers 
      })
    });
    if (res.ok) {
      setNewGameName('');
      setSelectedPlayers([]);
      setShowNewGame(false);
      fetchData();
    }
  }

  async function initDb() {
    const res = await fetch('/api/init', { method: 'POST' });
    const data = await res.json();
    alert(data.message || data.error);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-4xl">🀄</span>
            麻將計數機
          </h1>
          <button 
            onClick={initDb}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
          >
            初始化資料庫
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <p className="text-sm opacity-70">總玩家</p>
            <p className="text-3xl font-bold">{players.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <p className="text-sm opacity-70">進行中牌局</p>
            <p className="text-3xl font-bold">{games.filter(g => g.status === 'active').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <p className="text-sm opacity-70">已完成牌局</p>
            <p className="text-3xl font-bold">{games.filter(g => g.status === 'completed').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
            <p className="text-sm opacity-70">支援規則</p>
            <p className="text-3xl font-bold">5</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Players */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-amber-500 to-orange-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    👥 玩家管理
                  </h2>
                  <button 
                    onClick={() => setShowNewPlayer(!showNewPlayer)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {showNewPlayer && (
                <form onSubmit={addPlayer} className="p-4 border-b bg-amber-50">
                  <input
                    type="text"
                    placeholder="輸入玩家名稱"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    required
                  />
                  <button type="submit" className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    添加玩家
                  </button>
                </form>
              )}

              <div className="max-h-96 overflow-y-auto">
                {players.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">尚無玩家</p>
                ) : (
                  players.map(p => (
                    <div key={p.id} className="p-3 border-b hover:bg-gray-50 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.games_played || 0} 場比賽 · 總分: {p.total_score || 0}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlayers([...selectedPlayers, p.id]);
                          } else {
                            setSelectedPlayers(selectedPlayers.filter(id => id !== p.id));
                          }
                        }}
                        className="w-5 h-5"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Games */}
          <div className="lg:col-span-2">
            {/* New Game Button */}
            <button
              onClick={() => setShowNewGame(!showNewGame)}
              className="w-full mb-6 p-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl shadow-xl text-white hover:shadow-2xl hover:scale-[1.02] transition"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🎮</span>
                <span className="text-xl font-bold">開新牌局</span>
                <span className="text-sm opacity-80">({selectedPlayers.length} 位玩家已選擇)</span>
              </div>
            </button>

            {/* New Game Form */}
            {showNewGame && (
              <form onSubmit={createGame} className="mb-6 bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <input
                    type="text"
                    placeholder="牌局名稱"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 text-lg"
                    required
                  />
                  
                  <p className="text-sm text-gray-600 mb-3">選擇麻雀規則:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {VARIANTS.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v.id)}
                        className={`p-4 rounded-xl border-2 transition text-left ${
                          selectedVariant === v.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <span className="text-2xl">{v.emoji}</span>
                        <p className="font-bold mt-1">{v.name}</p>
                        <p className="text-xs text-gray-500">{v.desc}</p>
                      </button>
                    ))}
                  </div>

                  {selectedPlayers.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">已選擇玩家:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlayers.map(pid => {
                          const p = players.find(pl => pl.id === pid);
                          return p ? (
                            <span key={pid} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {p.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={selectedPlayers.length < 3}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    開始牌局
                  </button>
                </div>
              </form>
            )}

            {/* Games List */}
            <h3 className="text-xl font-bold text-white mb-4">進行中牌局</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {games.filter(g => g.status === 'active').map(game => (
                <Link 
                  key={game.id} 
                  href={`/game/${game.id}`}
                  className="bg-white/95 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{game.name}</h4>
                      <p className="text-sm text-gray-500">
                        {VARIANTS.find(v => v.id === game.variant)?.name || game.variant}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      進行中
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {game.players?.map((p: any) => (
                      <div key={p.id} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold" title={p.name}>
                        {p.name.charAt(0)}
                      </div>
                    ))}
                    <span className="text-sm text-gray-500">{game.player_count} 人</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    第 {game.current_round} 局 · {game.current_wind}風
                  </div>
                </Link>
              ))}
              {games.filter(g => g.status === 'active').length === 0 && (
                <p className="text-white/60 col-span-2 text-center py-8">暫無進行中牌局</p>
              )}
            </div>

            {/* Completed Games */}
            {games.filter(g => g.status === 'completed').length > 0 && (
              <>
                <h3 className="text-xl font-bold text-white mb-4 mt-8">已完成牌局</h3>
                <div className="grid md:grid-cols-2 gap-4 opacity-70">
                  {games.filter(g => g.status === 'completed').map(game => (
                    <Link 
                      key={game.id} 
                      href={`/game/${game.id}`}
                      className="bg-white/90 rounded-2xl p-5 shadow-lg hover:shadow-xl transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{game.name}</h4>
                          <p className="text-sm text-gray-500">{game.variant}</p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          已完成
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(game.completed_at).toLocaleDateString()} 完成
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

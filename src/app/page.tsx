'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player } from '@/types';

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

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
      setShowAddPlayer(false);
      fetchData();
    }
  }

  async function quickStartGame() {
    if (players.length < 4) {
      alert('請先添加4位玩家');
      return;
    }
    
    const selectedPlayers = players.slice(0, 4).map(p => p.id);
    
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: '麻雀局', 
        variant: 'hongkong',
        playerIds: selectedPlayers,
        customSettings: {
          fullLiability: true,
          selfDrawMultiplier: 2,
        }
      })
    });
    
    if (res.ok) {
      const game = await res.json();
      window.location.href = `/game/${game.id}`;
    }
  }

  async function initDb() {
    const res = await fetch('/api/init', { method: 'POST' });
    const data = await res.json();
    alert(data.message || data.error);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">🇭🇰 麻雀記帳</h1>
          <button onClick={initDb} className="text-xs bg-red-800 px-3 py-1 rounded">
            初始化
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Player List */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">玩家 ({players.length})</h2>
            <button 
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="text-red-600 text-sm font-medium"
            >
              {showAddPlayer ? '取消' : '+ 添加'}
            </button>
          </div>

          {showAddPlayer && (
            <form onSubmit={addPlayer} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="玩家名稱"
                className="flex-1 px-3 py-2 border rounded text-sm"
                required
              />
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded text-sm">
                添加
              </button>
            </form>
          )}

          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {['東', '南', '西', '北'][i] || '?'}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {p.games_played || 0} 場
                </span>
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-gray-400 text-center py-4 text-sm">暫無玩家</p>
            )}
          </div>
        </div>

        {/* Quick Start */}
        <button 
          onClick={quickStartGame}
          disabled={players.length < 4}
          className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg disabled:bg-gray-400"
        >
          🀄 快速開局 (4人)
        </button>

        {/* Recent Games */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-gray-800 mb-3">最近牌局</h2>
          <div className="space-y-2">
            {games.slice(0, 5).map(game => (
              <Link 
                key={game.id}
                href={`/game/${game.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium">{game.name}</p>
                  <p className="text-xs text-gray-500">
                    {game.status === 'active' ? '進行中' : '已完成'}
                    {' · '}
                    第{game.current_round}局
                  </p>
                </div>
                <span className="text-red-600">→</span>
              </Link>
            ))}
            {games.length === 0 && (
              <p className="text-gray-400 text-center py-4 text-sm">暫無牌局</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

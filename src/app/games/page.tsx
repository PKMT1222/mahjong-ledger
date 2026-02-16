'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const VARIANTS = [
  { id: 'all', name: '全部' },
  { id: 'hongkong', name: '香港麻雀' },
  { id: 'taiwan', name: '台灣麻將' },
  { id: 'japanese', name: '日本麻雀' },
  { id: 'hk-taiwan', name: '港式台灣' },
  { id: 'paoma', name: '跑馬仔' },
];

export default function GamesSearchPage() {
  const { user, token } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [variant, setVariant] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMyGamesOnly, setShowMyGamesOnly] = useState(false);

  useEffect(() => {
    fetchGames();
  }, [search, variant, status, page, showMyGamesOnly]);

  async function fetchGames() {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (variant !== 'all') params.append('variant', variant);
    if (status !== 'all') params.append('status', status);
    if (showMyGamesOnly && user) params.append('userId', user.id.toString());
    params.append('page', page.toString());
    params.append('limit', '20');
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch(`/api/games?${params}`, { headers });
      const data = await res.json();
      
      if (res.ok) {
        setGames(data.games);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-rose-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/70 hover:text-white">← 返回</Link>
              <h1 className="text-2xl font-bold text-white">🔍 搜尋牌局</h1>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-white/80">👤 {user.username}</span>
                <Link 
                  href="/auth" 
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                >
                  帳戶
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">搜尋</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="牌局名稱或玩家..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">規則</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                {VARIANTS.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">全部</option>
                <option value="active">進行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            
            {/* My Games Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyGamesOnly}
                  onChange={(e) => setShowMyGamesOnly(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm">只顯示我的牌局</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-white">載入中...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">找不到牌局</p>
            <p className="text-white/40 text-sm mt-2">試試其他搜尋條件</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {games.map(game => (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{game.name}</h3>
                      <p className="text-sm text-gray-500">
                        {game.variant === 'hongkong' && '🇭🇰 香港麻雀'}
                        {game.variant === 'taiwan' && '🀄 台灣麻將'}
                        {game.variant === 'japanese' && '🎌 日本麻雀'}
                        {game.variant === 'hk-taiwan' && '🎋 港式台灣'}
                        {game.variant === 'paoma' && '🐎 跑馬仔'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      game.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {game.status === 'active' ? '進行中' : '已完成'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {game.players?.slice(0, 4).map((p: any) => (
                      <div 
                        key={p.id} 
                        className="w-8 h-8 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        title={p.name}
                      >
                        {p.name.charAt(0)}
                      </div>
                    ))}
                    <span className="text-sm text-gray-500">{game.player_count} 人</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      {game.status === 'completed' && game.completed_at
                        ? new Date(game.completed_at).toLocaleDateString('zh-HK') + ' 完成'
                        : `第 ${game.current_round} 局 · ${game.current_wind}風`
                      }
                    </span>
                    {game.owner_username && (
                      <span>👤 {game.owner_username}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-30"
                >
                  上一頁
                </button>
                <span className="px-4 py-2 text-white">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-30"
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

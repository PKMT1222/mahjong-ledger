'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Game {
  id: number;
  name: string;
  variant: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
  current_round: number;
  players?: { id: number; name: string; final_score: number }[];
  round_count?: number;
}

interface FilterOptions {
  variant: string;
  status: string;
  dateRange: string;
  searchQuery: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    variant: 'all',
    status: 'all',
    dateRange: 'all',
    searchQuery: '',
  });

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    setLoading(true);
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  }

  // Filter games
  const filteredGames = games.filter(game => {
    // Variant filter
    if (filters.variant !== 'all' && game.variant !== filters.variant) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && game.status !== filters.status) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const gameDate = new Date(game.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case 'today':
          if (daysDiff > 0) return false;
          break;
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        case '3months':
          if (daysDiff > 90) return false;
          break;
      }
    }
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const nameMatch = game.name.toLowerCase().includes(query);
      const playerMatch = game.players?.some(p => p.name.toLowerCase().includes(query));
      if (!nameMatch && !playerMatch) return false;
    }
    
    return true;
  });

  const completedGames = filteredGames.filter(g => g.status === 'completed');
  const activeGames = filteredGames.filter(g => g.status === 'active');

  function toggleSelection(gameId: number) {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  }

  function selectAll() {
    if (selectedGames.size === completedGames.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(completedGames.map(g => g.id)));
    }
  }

  async function deleteGame(gameId: number, gameName: string, isActive: boolean) {
    const message = isActive
      ? `確定要刪除進行中對局 "${gameName}" 嗎？\n\n⚠️ 警告：此對局尚未結束，刪除後所有進度將會遺失！`
      : `確定要刪除牌局 "${gameName}" 嗎？`;
    
    if (!confirm(message)) return;
    
    try {
      const res = await fetch(`/api/games?id=${gameId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGames();
        setSelectedGames(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameId);
          return newSet;
        });
      } else {
        const error = await res.json();
        alert('❌ 刪除失敗: ' + (error.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('❌ 刪除失敗: ' + error.message);
    }
  }

  async function batchDelete() {
    if (selectedGames.size === 0) return;
    
    const gameIds = Array.from(selectedGames);
    let successCount = 0;
    let failCount = 0;
    
    for (const gameId of gameIds) {
      try {
        const res = await fetch(`/api/games?id=${gameId}`, { method: 'DELETE' });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    
    setShowBatchDeleteConfirm(false);
    setSelectedGames(new Set());
    fetchGames();
    
    if (failCount > 0) {
      alert(`✅ 已刪除 ${successCount} 個牌局\n❌ ${failCount} 個失敗`);
    } else {
      alert(`✅ 成功刪除 ${successCount} 個牌局`);
    }
  }

  async function clearAllHistory() {
    const completedIds = games.filter(g => g.status === 'completed').map(g => g.id);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const gameId of completedIds) {
      try {
        const res = await fetch(`/api/games?id=${gameId}`, { method: 'DELETE' });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    
    setShowClearConfirm(false);
    fetchGames();
    
    if (failCount > 0) {
      alert(`✅ 已清除 ${successCount} 個歷史紀錄\n❌ ${failCount} 個失敗`);
    } else {
      alert(`✅ 成功清除 ${successCount} 個歷史紀錄`);
    }
  }

  function getVariantName(variant: string) {
    const names: { [key: string]: string } = {
      hongkong: '香港麻雀',
      taiwan: '台灣麻將',
      japanese: '日本麻雀',
    };
    return names[variant] || variant;
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">📜 歷史紀錄</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-3 text-center shadow">
            <p className="text-2xl font-bold text-gray-800">{games.length}</p>
            <p className="text-xs text-gray-500">總牌局</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow">
            <p className="text-2xl font-bold text-green-600">{games.filter(g => g.status === 'active').length}</p>
            <p className="text-xs text-gray-500">進行中</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow">
            <p className="text-2xl font-bold text-blue-600">{games.filter(g => g.status === 'completed').length}</p>
            <p className="text-xs text-gray-500">已完成</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-bold text-gray-800">🔍 篩選</h2>
          
          {/* Search */}
          <input
            type="text"
            placeholder="搜尋牌局名稱或玩家..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          
          {/* Filter Row */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.variant}
              onChange={(e) => setFilters({ ...filters, variant: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">所有規則</option>
              <option value="hongkong">香港麻雀</option>
              <option value="taiwan">台灣麻將</option>
              <option value="japanese">日本麻雀</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">所有狀態</option>
              <option value="active">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          
          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">所有時間</option>
            <option value="today">今天</option>
            <option value="week">最近7天</option>
            <option value="month">最近30天</option>
            <option value="3months">最近3個月</option>
          </select>
          
          {/* Clear Filters */}
          {(filters.variant !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.searchQuery) && (
            <button
              onClick={() => setFilters({
                variant: 'all',
                status: 'all',
                dateRange: 'all',
                searchQuery: '',
              })}
              className="w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-lg"
            >
              清除篩選
            </button>
          )}
        </div>

        {/* Batch Actions */}
        {completedGames.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">⚡ 批量操作</h2>
              <span className="text-sm text-gray-500">
                已選 {selectedGames.size} 個
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium"
              >
                {selectedGames.size === completedGames.length ? '取消全選' : '全選已完成'}
              </button>
              
              {selectedGames.size > 0 && (
                <button
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                >
                  刪除已選 ({selectedGames.size})
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              🗑️ 清空所有歷史 ({completedGames.length})
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>顯示 {filteredGames.length} 個結果</span>
          {filters.variant !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.searchQuery ? (
            <span className="text-blue-600">已套用篩選</span>
          ) : null}
        </div>

        {/* Games List */}
        <div className="space-y-3">
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🀄</p>
              <p className="text-gray-500">沒有符合條件的牌局</p>
            </div>
          ) : (
            filteredGames.map(game => (
              <div
                key={game.id}
                className={`bg-white rounded-lg shadow p-4 transition ${
                  selectedGames.has(game.id) ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for completed games */}
                  {game.status === 'completed' && (
                    <input
                      type="checkbox"
                      checked={selectedGames.has(game.id)}
                      onChange={() => toggleSelection(game.id)}
                      className="mt-1 w-5 h-5"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold truncate">{game.name}</h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(game.created_at)} · {getVariantName(game.variant)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          game.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {game.status === 'active' ? '進行中' : '已完成'}
                      </span>
                    </div>
                    
                    {/* Players */}
                    {game.players && game.players.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {game.players.map((p) => (
                          <span
                            key={p.id}
                            className={`text-xs px-2 py-0.5 rounded ${
                              p.final_score > 0
                                ? 'bg-green-100 text-green-700'
                                : p.final_score < 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.name} {p.final_score > 0 ? '+' : ''}{p.final_score}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/game/${game.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看詳情 →
                      </Link>
                      
                      <button
                        onClick={() => deleteGame(game.id, game.name, game.status === 'active')}
                        className="text-sm text-red-400 hover:text-red-600 ml-auto"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">確認批量刪除</h3>
            <p className="text-gray-600 mb-4">
              確定要刪除選中的 <span className="font-bold text-red-600">{selectedGames.size}</span> 個牌局嗎？
            </p>
            <p className="text-sm text-gray-400 mb-4">此操作不可復原</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={batchDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2 text-red-600">⚠️ 清空所有歷史</h3>
            <p className="text-gray-600 mb-4">
              確定要刪除 <span className="font-bold">所有 {completedGames.length} 個</span> 已完成的牌局嗎？
            </p>
            <p className="text-sm text-red-500 mb-4">⚠️ 此操作不可復原！進行中的牌局不會被刪除。</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={clearAllHistory}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold"
              >
                確認清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FadeIn } from '@/components/AnimatedElements';

interface HandNote {
  id: number;
  game_name: string;
  player_name: string;
  hand_type: string;
  custom_name: string;
  winning_tile: string;
  is_dealer: boolean;
  fan_count: number;
  score: number;
  notes: string;
  created_at: string;
}

export default function NotebookPage() {
  const [handNotes, setHandNotes] = useState<HandNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'diary' | 'review'>('diary');
  const [filter, setFilter] = useState({
    player: 'all',
    handType: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchHandNotes();
  }, []);

  async function fetchHandNotes() {
    setLoading(true);
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setHandNotes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching hand notes:', error);
    }
    setLoading(false);
  }

  // Calculate statistics
  const stats = {
    totalHands: handNotes.length,
    mostCommonHand: getMostCommonHand(handNotes),
    topPlayers: getTopPlayers(handNotes),
    monthlyTrend: getMonthlyTrend(handNotes)
  };

  function getMostCommonHand(notes: HandNote[]) {
    const counts: { [key: string]: number } = {};
    notes.forEach(n => {
      const type = n.hand_type || n.custom_name || '未知';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  function getTopPlayers(notes: HandNote[]) {
    const counts: { [key: string]: number } = {};
    notes.forEach(n => {
      counts[n.player_name] = (counts[n.player_name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  function getMonthlyTrend(notes: HandNote[]) {
    const counts: { [key: string]: number } = {};
    notes.forEach(n => {
      const date = new Date(n.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort();
  }

  const filteredNotes = handNotes.filter(note => {
    if (filter.player !== 'all' && note.player_name !== filter.player) return false;
    if (filter.handType !== 'all') {
      const type = note.hand_type || note.custom_name || '';
      if (!type.includes(filter.handType)) return false;
    }
    if (filter.dateRange !== 'all') {
      const noteDate = new Date(note.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (filter.dateRange) {
        case 'today': if (daysDiff > 0) return false; break;
        case 'week': if (daysDiff > 7) return false; break;
        case 'month': if (daysDiff > 30) return false; break;
      }
    }
    return true;
  });

  // Get unique players and hand types for filters
  const uniquePlayers = [...new Set(handNotes.map(n => n.player_name))];
  const uniqueHandTypes = [...new Set(handNotes.map(n => n.hand_type || n.custom_name).filter(Boolean))];

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
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-white text-lg">←</Link>
            <h1 className="text-xl font-bold">📓 麻雀筆記本</h1>
            <div className="w-6"></div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-red-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex-1 py-2 text-sm font-medium tab-press transition-all duration-150 ${
                activeTab === 'diary' ? 'bg-red-600' : 'hover:bg-red-700/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              📝 手牌日記
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-2 text-sm font-medium tab-press transition-all duration-150 ${
                activeTab === 'review' ? 'bg-red-600' : 'hover:bg-red-700/50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              📊 年度回顧
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{stats.totalHands}</p>
              <p className="text-xs text-gray-500">總記錄手數</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">{uniquePlayers.length}</p>
              <p className="text-xs text-gray-500">參與玩家</p>
            </div>
          </div>
        </div>

        {activeTab === 'diary' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h2 className="font-bold text-gray-800">🔍 篩選</h2>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filter.player}
                  onChange={(e) => setFilter({ ...filter, player: e.target.value })}
                  className="px-2 py-2 border rounded text-sm"
                >
                  <option value="all">所有玩家</option>
                  {uniquePlayers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={filter.handType}
                  onChange={(e) => setFilter({ ...filter, handType: e.target.value })}
                  className="px-2 py-2 border rounded text-sm"
                >
                  <option value="all">所有牌型</option>
                  {uniqueHandTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={filter.dateRange}
                  onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
                  className="px-2 py-2 border rounded text-sm"
                >
                  <option value="all">所有時間</option>
                  <option value="today">今天</option>
                  <option value="week">最近7天</option>
                  <option value="month">最近30天</option>
                </select>
              </div>
            </div>

            {/* Hand List */}
            <div className="space-y-3">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-2">🀄</p>
                  <p className="text-gray-500">暫無手牌記錄</p>
                  <p className="text-sm text-gray-400 mt-2">在記錄食糊時添加詳細牌型</p>
                </div>
              ) : (
                filteredNotes.map((note, index) => (
                  <FadeIn key={note.id} delay={index * 50}>
                    <div className="bg-white rounded-lg shadow p-4 card-press" style={{ WebkitTapHighlightColor: 'transparent' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold">
                            {note.hand_type || note.custom_name || '未知牌型'}
                            {note.is_dealer && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 rounded">莊</span>}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString('zh-HK')} · {note.game_name}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-red-600">
                          {note.fan_count > 0 && `${note.fan_count}番`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{note.player_name}</span>
                        {note.winning_tile && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            食糊牌: {note.winning_tile}
                          </span>
                        )}
                      </div>
                      
                      {note.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          💬 {note.notes}
                        </p>
                      )}
                    </div>
                  </FadeIn>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'review' && (
          <>
            {/* Most Common Hands */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-800 mb-3">🏆 最常見牌型 (Top 5)</h2>
              {stats.mostCommonHand.length === 0 ? (
                <p className="text-gray-400 text-center py-4">暫無數據</p>
              ) : (
                <div className="space-y-2">
                  {stats.mostCommonHand.map(([hand, count], i) => (
                    <div key={hand} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'}
                        </span>
                        <span className="font-medium">{hand}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Players */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-800 mb-3">👑 食糊排行榜</h2>
              {stats.topPlayers.length === 0 ? (
                <p className="text-gray-400 text-center py-4">暫無數據</p>
              ) : (
                <div className="space-y-2">
                  {stats.topPlayers.map(([player, count], i) => (
                    <div key={player} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'}
                        </span>
                        <span className="font-medium">{player}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-800 mb-3">📈 月度趨勢</h2>
              {stats.monthlyTrend.length === 0 ? (
                <p className="text-gray-400 text-center py-4">暫無數據</p>
              ) : (
                <div className="space-y-2">
                  {stats.monthlyTrend.map(([month, count]) => (
                    <div key={month} className="flex items-center gap-2">
                      <span className="text-sm w-16">{month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full"
                          style={{ 
                            width: `${Math.min(100, (count / Math.max(...stats.monthlyTrend.map(t => t[1]))) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={() => alert('分享功能開發中...')}
              className="w-full bg-gradient-to-r from-red-600 to-pink-500 text-white py-4 rounded-lg font-bold btn-ripple"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              📤 生成年度回顧卡片
            </button>
          </>
        )}
      </main>
    </div>
  );
}

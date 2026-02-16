'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HandNote {
  id: number;
  player_name: string;
  game_name: string;
  game_date: string;
  round_number: number;
  round_wind: string;
  hand_type: string;
  hand_tiles: string[];
  winning_tile: string;
  is_self_draw: boolean;
  fan_count: number;
  score: number;
  notes: string;
  mood: string;
  location: string;
  tags: string[];
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<HandNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<HandNote[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    player: '',
    handType: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list');
  const [selectedNote, setSelectedNote] = useState<HandNote | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchPlayers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notes, filter]);

  async function fetchNotes() {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/players');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  function applyFilters() {
    let filtered = [...notes];
    
    if (filter.player) {
      filtered = filtered.filter(n => n.player_name === filter.player);
    }
    
    if (filter.handType) {
      filtered = filtered.filter(n => n.hand_type === filter.handType);
    }
    
    if (filter.startDate) {
      filtered = filtered.filter(n => new Date(n.game_date) >= new Date(filter.startDate));
    }
    
    if (filter.endDate) {
      filtered = filtered.filter(n => new Date(n.game_date) <= new Date(filter.endDate));
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.notes?.toLowerCase().includes(searchLower) ||
        n.hand_type?.toLowerCase().includes(searchLower) ||
        n.location?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredNotes(filtered);
  }

  // Group notes by date for calendar view
  const notesByDate = filteredNotes.reduce((acc, note) => {
    const date = new Date(note.game_date).toLocaleDateString('zh-HK');
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {} as { [key: string]: HandNote[] });

  // Calculate stats
  const stats = {
    totalHands: filteredNotes.length,
    selfDrawRate: filteredNotes.filter(n => n.is_self_draw).length / (filteredNotes.length || 1) * 100,
    avgFan: filteredNotes.reduce((sum, n) => sum + (n.fan_count || 0), 0) / (filteredNotes.length || 1),
    totalScore: filteredNotes.reduce((sum, n) => sum + (n.score || 0), 0),
    handTypes: filteredNotes.reduce((acc, n) => {
      acc[n.hand_type] = (acc[n.hand_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number })
  };

  const handTypeList = Object.entries(stats.handTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">📓 麻雀筆記</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* View Mode Tabs */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-lg shadow overflow-hidden mb-4">
          {[
            { id: 'list', label: '列表', icon: '📋' },
            { id: 'calendar', label: '日曆', icon: '📅' },
            { id: 'stats', label: '統計', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${
                viewMode === tab.id ? 'bg-red-600 text-white' : 'text-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
            placeholder="搜尋筆記內容..."
            className="w-full px-3 py-2 border rounded-lg"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filter.player}
              onChange={(e) => setFilter({...filter, player: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">全部玩家</option>
              {players.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            
            <select
              value={filter.handType}
              onChange={(e) => setFilter({...filter, handType: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">全部牌型</option>
              <option value="清一色">清一色</option>
              <option value="混一色">混一色</option>
              <option value="碰碰胡">碰碰胡</option>
              <option value="七對">七對</option>
              <option value="小三元">小三元</option>
              <option value="大三元">大三元</option>
              <option value="大四喜">大四喜</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({...filter, startDate: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="開始日期"
            />
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({...filter, endDate: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="結束日期"
            />
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto p-4">
        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暫無筆記</p>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => setSelectedNote(note)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{note.player_name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {note.hand_type}
                        </span>
                        {note.is_self_draw && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            自摸
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(note.game_date).toLocaleDateString('zh-HK')} · 
                        第{note.round_number}局
                      </p>
                      {note.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{note.fan_count}番</p>
                      <p className="text-sm text-gray-400">{note.score}分</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            {Object.entries(notesByDate)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, dayNotes]) => (
                <div key={date} className="bg-white rounded-lg shadow">
                  <div className="bg-gray-50 px-4 py-2 rounded-t-lg border-b">
                    <span className="font-bold">{date}</span>
                    <span className="text-sm text-gray-500 ml-2">({dayNotes.length} 手)</span>
                  </div>
                  <div className="p-2 space-y-2">
                    {dayNotes.map(note => (
                      <div 
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{note.player_name}</span>
                          <span className="text-sm text-red-600">{note.hand_type}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          第{note.round_number}局 · {note.fan_count}番
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* STATS VIEW */}
        {viewMode === 'stats' && (
          <div className="space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{stats.totalHands}</p>
                <p className="text-sm text-gray-500">總手數</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.selfDrawRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">自摸率</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.avgFan.toFixed(1)}</p>
                <p className="text-sm text-gray-500">平均番數</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.totalScore}</p>
                <p className="text-sm text-gray-500">總得分</p>
              </div>
            </div>

            {/* Hand Type Distribution */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">牌型分佈</h3>
              <div className="space-y-2">
                {handTypeList.map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <span className="w-20 text-sm">{type}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 mx-2">
                      <div 
                        className="bg-red-500 h-4 rounded-full"
                        style={{ width: `${(count / stats.totalHands) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Note Detail Modal */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">手牌詳情</h2>
              <button 
                onClick={() => setSelectedNote(null)}
                className="text-gray-400 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">玩家</span>
                <span className="font-bold">{selectedNote.player_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">牌型</span>
                <span className="font-bold text-red-600">{selectedNote.hand_type}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">番數</span>
                <span className="font-bold">{selectedNote.fan_count}番</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500">得分</span>
                <span className="font-bold">{selectedNote.score}分</span>
              </div>
              
              {selectedNote.is_self_draw && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">食糊方式</span>
                  <span className="text-green-600 font-medium">自摸</span>
                </div>
              )}
              
              {selectedNote.location && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">地點</span>
                  <span>{selectedNote.location}</span>
                </div>
              )}
              
              {selectedNote.mood && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">心情</span>
                  <span>{selectedNote.mood}</span>
                </div>
              )}
              
              {selectedNote.notes && (
                <div className="pt-3 border-t">
                  <span className="text-gray-500 block mb-1">備註</span>
                  <p className="text-gray-700">{selectedNote.notes}</p>
                </div>
              )}
              
              <div className="pt-3 border-t text-sm text-gray-400">
                {new Date(selectedNote.game_date).toLocaleString('zh-HK')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

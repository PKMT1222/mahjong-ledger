'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FadeIn } from '@/components/AnimatedElements';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatsData {
  global: {
    total_games: number;
    total_rounds: number;
    total_money_exchanged: number;
    avg_score_per_player: number;
    total_players: number;
  };
  topHandTypes: Array<{
    hand_type: string;
    count: number;
    percentage: number;
  }>;
  playerRankings: Array<{
    id: number;
    name: string;
    games_played: number;
    total_score: number;
    total_wins: number;
    total_self_draws: number;
    total_deal_ins: number;
    win_rate: number;
    rank_by_money: number;
    rank_by_self_draws: number;
    rank_by_deal_ins: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    games_count: number;
    rounds_count: number;
    total_winnings: number;
  }>;
  playerStats?: {
    basic: {
      id: number;
      name: string;
      total_games: number;
      total_score: number;
      total_wins: number;
      total_self_draws: number;
      total_deal_ins: number;
      avg_score: number;
      self_draw_rate: number;
      deal_in_rate: number;
    };
    favoriteHands: Array<{
      hand_type: string;
      count: number;
      total_fan: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      games_count: number;
      monthly_score: number;
      monthly_wins: number;
    }>;
    headToHead: Array<{
      opponent_name: string;
      opponent_id: number;
      games_together: number;
      wins_against: number;
      losses_to: number;
      win_rate: number;
    }>;
  };
  yearlySummary: Array<{
    year: number;
    total_games: number;
    total_rounds: number;
    total_winnings: number;
  }>;
  currentYear: string;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'player'>('global');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchStats();
  }, [selectedPlayer, selectedYear]);

  async function fetchStats() {
    setLoading(true);
    try {
      const url = selectedPlayer 
        ? `/api/stats/comprehensive?playerId=${selectedPlayer}&year=${selectedYear}`
        : `/api/stats/comprehensive?year=${selectedYear}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  }

  function formatMoney(amount: number): string {
    if (amount >= 1000000) return `¥${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `¥${(amount / 1000).toFixed(1)}K`;
    return `¥${amount}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500">載入統計數據中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">無法載入統計數據</p>
      </div>
    );
  }

  const { global, topHandTypes, playerRankings, monthlyTrend, playerStats, yearlySummary } = stats;

  // Chart data
  const monthlyChartData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [
      {
        label: '對局數',
        data: monthlyTrend.map(m => m.games_count),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const handTypeChartData = {
    labels: topHandTypes.map(h => h.hand_type),
    datasets: [
      {
        data: topHandTypes.map(h => h.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Header - Teal Design */}
      <header className="text-white p-4" style={{ 
        background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-white text-lg hover:opacity-80 transition-opacity">←</Link>
            <h1 className="text-xl font-bold">📊 統計中心</h1>
            <div className="w-6"></div>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center justify-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 rounded-xl text-slate-800 bg-white border-2 border-white/20 focus:border-white focus:outline-none"
            >
              {yearlySummary.map(y => (
                <option key={y.year} value={y.year}>{y.year}年</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => { setActiveTab('global'); setSelectedPlayer(null); }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'global'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🌍 全局統計
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'player'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            👤 玩家統計
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Global Statistics */}
        {activeTab === 'global' && (
          <>
            {/* Overview Cards */}
            <FadeIn>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-md p-4 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <p className="text-3xl font-bold" style={{ color: '#0D9488' }}>{global.total_games}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">總對局數</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-4 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <p className="text-3xl font-bold" style={{ color: '#7C3AED' }}>{global.total_rounds}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">總手數</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-4 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <p className="text-3xl font-bold" style={{ color: global.total_money_exchanged >= 0 ? '#059669' : '#DC2626' }}>
                    {formatMoney(global.total_money_exchanged)}
                  </p>
                  <p className="text-sm text-slate-500 font-medium mt-1">資金流動</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-4 text-center" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <p className="text-3xl font-bold text-purple-600">{global.total_players}</p>
                  <p className="text-sm text-gray-500">參與玩家</p>
                </div>
              </div>
            </FadeIn>

            {/* Monthly Trend Chart */}
            <FadeIn delay={100}>
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-lg font-bold mb-4">📈 月度趨勢 ({selectedYear})</h2>
                <div className="h-64">
                  <Line 
                    data={monthlyChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </div>
              </div>
            </FadeIn>

            {/* Top Hand Types */}
            <FadeIn delay={200}>
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-lg font-bold mb-4">🏆 熱門牌型 Top 5</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="h-64">
                    <Doughnut
                      data={handTypeChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: { boxWidth: 12 },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {topHandTypes.map((hand, i) => (
                      <div key={hand.hand_type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'}
                          </span>
                          <span className="font-medium">{hand.hand_type}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{hand.count} 次</p>
                          <p className="text-xs text-gray-500">{hand.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Player Rankings */}
            <FadeIn delay={300}>
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-lg font-bold mb-4">👑 玩家排行榜</h2>
                <div className="space-y-3">
                  {playerRankings.slice(0, 5).map((player, i) => (
                    <div 
                      key={player.id}
                      onClick={() => { setSelectedPlayer(player.id); setActiveTab('player'); }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <div>
                          <p className="font-bold">{player.name}</p>
                          <p className="text-xs text-gray-500">{player.games_played} 局 | {player.total_wins} 勝</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${player.total_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {player.total_score > 0 ? '+' : ''}{formatMoney(player.total_score)}
                        </p>
                        <p className="text-xs text-gray-500">勝率 {player.win_rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </>
        )}

        {/* Player Statistics */}
        {activeTab === 'player' && (
          <>
            {/* Player Selector */}
            <FadeIn>
              <div className="bg-white rounded-xl shadow p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇玩家</label>
                <select
                  value={selectedPlayer || ''}
                  onChange={(e) => setSelectedPlayer(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">請選擇玩家...</option>
                  {playerRankings.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatMoney(p.total_score)})</option>
                  ))}
                </select>
              </div>
            </FadeIn>

            {playerStats && (
              <>
                {/* Player Overview */}
                <FadeIn delay={100}>
                  <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">{playerStats.basic.name} 的統計</h2>
                      <span className="text-sm text-gray-500">{playerStats.basic.total_games} 局</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className={`text-2xl font-bold ${playerStats.basic.total_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatMoney(playerStats.basic.total_score)}
                        </p>
                        <p className="text-xs text-gray-500">總輸贏</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{playerStats.basic.total_wins}</p>
                        <p className="text-xs text-gray-500">食糊次數</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{playerStats.basic.total_self_draws}</p>
                        <p className="text-xs text-gray-500">自摸次數</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{playerStats.basic.avg_score.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">平均得分</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">自摸率</p>
                        <p className="text-xl font-bold">{playerStats.basic.self_draw_rate}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">出銃率</p>
                        <p className="text-xl font-bold">{playerStats.basic.deal_in_rate}%</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* Favorite Hands */}
                {playerStats.favoriteHands.length > 0 && (
                  <FadeIn delay={200}>
                    <div className="bg-white rounded-xl shadow p-4">
                      <h2 className="text-lg font-bold mb-4">🀄 常用牌型</h2>
                      <div className="space-y-2">
                        {playerStats.favoriteHands.map((hand, i) => (
                          <div key={hand.hand_type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{i < 3 ? ['🥇', '🥈', '🥉'][i] : '•'}</span>
                              <span>{hand.hand_type}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{hand.count} 次</p>
                              <p className="text-xs text-gray-500">{hand.total_fan} 番</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Head to Head */}
                {playerStats.headToHead.length > 0 && (
                  <FadeIn delay={300}>
                    <div className="bg-white rounded-xl shadow p-4">
                      <h2 className="text-lg font-bold mb-4">⚔️ 對戰記錄</h2>
                      <div className="space-y-2">
                        {playerStats.headToHead.map((h2h) => (
                          <div key={h2h.opponent_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">vs {h2h.opponent_name}</p>
                              <p className="text-xs text-gray-500">{h2h.games_together} 局對戰</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${h2h.win_rate >= 50 ? 'text-red-600' : 'text-green-600'}`}>
                                {h2h.win_rate}% 勝率
                              </p>
                              <p className="text-xs text-gray-500">{h2h.wins_against} 勝 {h2h.losses_to} 負</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                )}
              </>
            )}

            {!selectedPlayer && (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">👤</p>
                <p className="text-gray-500">請選擇一位玩家查看詳細統計</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

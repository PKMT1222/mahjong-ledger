'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HAND_TYPES, WIND_EMOJI, GameVariant } from '@/types';

interface Player {
  id: number;
  name: string;
  seat_position: number;
  final_score: number;
  is_dealer: boolean;
  wins: number;
  self_draws: number;
  deal_ins: number;
}

interface Round {
  id: number;
  round_number: number;
  round_wind: string;
  hand_number: number;
  dealer_name: string;
  winners: { id: number; name: string }[];
  loser_name: string;
  is_self_draw: boolean;
  hand_type: string;
  base_tai: number;
  total_points: number;
  player_scores: { [key: string]: number };
  is_bao_zimo: boolean;
  is_liichi: boolean;
}

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [handTypes, setHandTypes] = useState<{ name: string; tai: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'score' | 'history' | 'stats'>('score');
  
  // New round form
  const [showNewRound, setShowNewRound] = useState(false);
  const [dealerId, setDealerId] = useState('');
  const [winnerIds, setWinnerIds] = useState<number[]>([]);
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [selectedHands, setSelectedHands] = useState<{ name: string; tai: number }[]>([]);
  const [isBaoZimo, setIsBaoZimo] = useState(false);
  const [isLiichi, setIsLiichi] = useState(false);
  const [isExhaustiveDraw, setIsExhaustiveDraw] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  async function fetchGameData() {
    const [gameRes, roundsRes] = await Promise.all([
      fetch('/api/games'),
      fetch(`/api/games/${gameId}/rounds`)
    ]);
    
    if (gameRes.ok) {
      const games = await gameRes.json();
      const g = games.find((ga: any) => ga.id === parseInt(gameId));
      setGame(g);
      if (g) {
        setPlayers(g.players || []);
        // Load hand types for this variant
        const htRes = await fetch(`/api/hand-types?variant=${g.variant}`);
        if (htRes.ok) setHandTypes(await htRes.json());
      }
    }
    
    if (roundsRes.ok) {
      setRounds(await roundsRes.json());
    }
  }

  const currentDealer = players.find(p => p.is_dealer);

  async function addRound(e: React.FormEvent) {
    e.preventDefault();
    
    const roundData: any = {
      dealer_id: parseInt(dealerId) || currentDealer?.id,
      winner_ids: winnerIds,
      loser_id: loserId ? parseInt(loserId) : null,
      is_self_draw: isSelfDraw,
      hand_types: selectedHands,
      base_tai: selectedHands.reduce((sum, h) => sum + h.tai, 0),
      is_bao_zimo: isBaoZimo,
      is_liichi: isLiichi,
      is_exhaustive_draw: isExhaustiveDraw,
      notes
    };
    
    if (isExhaustiveDraw) {
      roundData.winner_ids = [];
      roundData.loser_id = null;
    }
    
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roundData)
    });
    
    if (res.ok) {
      resetForm();
      fetchGameData();
    }
  }

  function resetForm() {
    setShowNewRound(false);
    setDealerId('');
    setWinnerIds([]);
    setLoserId('');
    setIsSelfDraw(false);
    setSelectedHands([]);
    setIsBaoZimo(false);
    setIsLiichi(false);
    setIsExhaustiveDraw(false);
    setNotes('');
  }

  function toggleHand(hand: { name: string; tai: number }) {
    const exists = selectedHands.find(h => h.name === hand.name);
    if (exists) {
      setSelectedHands(selectedHands.filter(h => h.name !== hand.name));
    } else {
      setSelectedHands([...selectedHands, hand]);
    }
  }

  async function undoLastRound() {
    if (!confirm('確定要取消上一局嗎?')) return;
    const res = await fetch(`/api/games/${gameId}/undo`, { method: 'POST' });
    if (res.ok) {
      fetchGameData();
    }
  }

  async function endGame() {
    if (!confirm('確定要結束這局遊戲嗎?')) return;
    const res = await fetch('/api/games', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(gameId), status: 'completed' })
    });
    if (res.ok) {
      fetchGameData();
    }
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center">加載中...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/70 hover:text-white">
                ← 返回
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{game.name}</h1>
                <p className="text-sm text-white/60">
                  {game.variant === 'taiwan' && '台灣麻將'}
                  {game.variant === 'japanese' && '日本麻雀'}
                  {game.variant === 'hongkong' && '香港麻雀'}
                  {game.variant === 'hk-taiwan' && '港式台灣'}
                  {game.variant === 'paoma' && '跑馬仔'}
                  {' · '}
                  第 {game.current_round} 局 · {game.current_wind}風
                  {game.dealer_repeat > 0 && ` (連${game.dealer_repeat})`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {game.status === 'active' && (
                <>
                  <button 
                    onClick={undoLastRound}
                    disabled={rounds.length === 0}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-30"
                  >
                    ↩️ 還原
                  </button>
                  <button 
                    onClick={endGame}
                    className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500"
                  >
                    結束牌局
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Scoreboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📊 即時計分板
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map(p => (
              <div 
                key={p.id} 
                className={`p-4 rounded-xl text-center ${
                  p.is_dealer 
                    ? 'bg-amber-500/90 text-white' 
                    : 'bg-white/90'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{WIND_EMOJI[getWind(p.seat_position)]}</span>
                  <span className="font-bold text-lg">{p.name}</span>
                  {p.is_dealer && <span className="text-xs bg-white/30 px-2 py-0.5 rounded">莊</span>}
                </div>
                <p className={`text-3xl font-bold ${p.final_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.final_score > 0 ? '+' : ''}{p.final_score.toLocaleString()}
                </p>
                <div className="text-xs mt-1 space-x-2">
                  <span>🏆{p.wins}</span>
                  <span>🎯{p.self_draws}</span>
                  <span>💥{p.deal_ins}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['score', 'history', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeTab === tab 
                  ? 'bg-white text-green-900' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab === 'score' && '🎮 計分'}
              {tab === 'history' && '📜 牌局紀錄'}
              {tab === 'stats' && '📈 統計'}
            </button>
          ))}
        </div>

        {/* Score Tab */}
        {activeTab === 'score' && game.status === 'active' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {!showNewRound ? (
              <button
                onClick={() => setShowNewRound(true)}
                className="w-full p-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl">➕</span>
                  <span className="text-2xl font-bold">記錄新一局</span>
                </div>
              </button>
            ) : (
              <form onSubmit={addRound} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">記錄得分</h3>
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Dealer Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">莊家</label>
                  <div className="flex gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDealerId(p.id.toString())}
                        className={`px-4 py-2 rounded-lg border-2 transition ${
                          dealerId === p.id.toString() || (!dealerId && p.is_dealer)
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        {p.name} {p.is_dealer && '(當前)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Options */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSelfDraw}
                      onChange={(e) => setIsSelfDraw(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>自摸</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBaoZimo}
                      onChange={(e) => setIsBaoZimo(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>包自摸</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isLiichi}
                      onChange={(e) => setIsLiichi(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>立直</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isExhaustiveDraw}
                      onChange={(e) => setIsExhaustiveDraw(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>荒牌流局</span>
                  </label>
                </div>

                {!isExhaustiveDraw && (
                  <>
                    {/* Winners */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        {isSelfDraw ? '自摸玩家' : '食糊玩家'} 
                        <span className="text-gray-400 text-xs ml-2">(可多選 - 一炮多響)</span>
                      </label>
                      <div className="flex gap-2">
                        {players.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (winnerIds.includes(p.id)) {
                                setWinnerIds(winnerIds.filter(id => id !== p.id));
                              } else {
                                setWinnerIds([...winnerIds, p.id]);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg border-2 transition ${
                              winnerIds.includes(p.id)
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Loser (if not self-draw) */}
                    {!isSelfDraw && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">出統玩家</label>
                        <select
                          value={loserId}
                          onChange={(e) => setLoserId(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                        >
                          <option value="">選擇玩家</option>
                          {players.filter(p => !winnerIds.includes(p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Hand Types */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        牌型/番種 
                        <span className="text-green-600 ml-2">
                          合計: {selectedHands.reduce((sum, h) => sum + h.tai, 0)} 台/番
                        </span>
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                        {handTypes.map(hand => (
                          <button
                            key={hand.name}
                            type="button"
                            onClick={() => toggleHand(hand)}
                            className={`p-2 rounded text-sm text-left transition ${
                              selectedHands.find(h => h.name === hand.name)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-medium">{hand.name}</div>
                            <div className="text-xs opacity-80">{hand.tai} 台</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">備註</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="例如: 槓上開花、海底撈月..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                    rows={2}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition"
                >
                  確認記錄
                </button>
              </form>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg">📜 牌局紀錄</h3>
            </div>
            {rounds.length === 0 ? (
              <p className="p-8 text-center text-gray-500">尚無紀錄</p>
            ) : (
              <div className="divide-y">
                {rounds.map((round, idx) => (
                  <div key={round.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">第 {idx + 1} 局</span>
                          <span className="text-sm text-gray-500">
                            {round.round_wind}風 {round.hand_number}局
                          </span>
                          <span className="text-sm text-gray-400">
                            莊: {round.dealer_name}
                          </span>
                        </div>
                        <div className="text-sm">
                          {round.is_exhaustive_draw ? (
                            <span className="text-gray-500">荒牌流局</span>
                          ) : (
                            <>
                              {round.winners?.map(w => (
                                <span key={w.id} className="text-green-600 font-medium mr-2">
                                  {w.name} 食糊
                                </span>
                              ))}
                              {round.loser_name && (
                                <span className="text-red-500">
                                  ← {round.loser_name} 出統
                                </span>
                              )}
                              {round.is_self_draw && (
                                <span className="text-amber-600 ml-2">(自摸)</span>
                              )}
                            </>
                          )}
                        </div>
                        {round.hand_type && (
                          <div className="text-sm text-gray-500 mt-1">
                            {round.hand_type} · {round.base_tai} 台
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{round.total_points?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">分</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-lg mb-4">📈 本局統計</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {players.map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-bold text-lg">{p.name}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">食糊次數</span>
                      <span className="font-medium">{p.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">自摸次數</span>
                      <span className="font-medium">{p.self_draws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">出統次數</span>
                      <span className="font-medium">{p.deal_ins}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500">當前分數</span>
                      <span className={`font-bold ${p.final_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {p.final_score > 0 ? '+' : ''}{p.final_score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Titles */}
            <div className="mt-6">
              <h4 className="font-bold mb-3">🏆 稱號</h4>
              <div className="flex flex-wrap gap-2">
                {players.reduce((max, p) => p.wins > max.wins ? p : max, players[0])?.wins > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    🏆 食糊王: {players.reduce((max, p) => p.wins > max.wins ? p : max, players[0])?.name}
                  </span>
                )}
                {players.reduce((max, p) => p.self_draws > max.self_draws ? p : max, players[0])?.self_draws > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    🎯 自摸王: {players.reduce((max, p) => p.self_draws > max.self_draws ? p : max, players[0])?.name}
                  </span>
                )}
                {players.reduce((max, p) => p.deal_ins > max.deal_ins ? p : max, players[0])?.deal_ins > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    💥 出統王: {players.reduce((max, p) => p.deal_ins > max.deal_ins ? p : max, players[0])?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function getWind(position: number): string {
  const winds = ['東', '南', '西', '北'];
  return winds[(position - 1) % 4] || '東';
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { WIND_EMOJI } from '@/types';

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
}

interface GameSettings {
  fullLiability: boolean;
  selfDrawMultiplier: number;
  jackpotEnabled: boolean;
}

// Hong Kong specific hand types with fan values
const HK_HAND_TYPES = [
  { name: '雞胡', fan: 0, desc: '任何胡牌' },
  { name: '無花', fan: 1, desc: '沒有花牌' },
  { name: '正花', fan: 1, desc: '正位花牌' },
  { name: '自摸', fan: 1, desc: '自己摸糊' },
  { name: '槓上開花', fan: 3, desc: '槓牌後摸糊' },
  { name: '搶槓', fan: 3, desc: '搶別人槓牌' },
  { name: '海底撈月', fan: 3, desc: '最後一隻牌' },
  { name: '七對', fan: 4, desc: '七對子' },
  { name: '花胡', fan: 3, desc: '集齊花牌' },
  { name: '碰碰胡', fan: 3, desc: '全刻子' },
  { name: '混一色', fan: 3, desc: '一色+字' },
  { name: '小三元', fan: 5, desc: '中發白兩刻' },
  { name: '清一色', fan: 7, desc: '同一花色' },
  { name: '混么九', fan: 7, desc: '全么九+字' },
  { name: '清么九', fan: 7, desc: '全么九' },
  { name: '大三元', fan: 8, desc: '中發白三刻' },
  { name: '小四喜', fan: 10, desc: '東南西北三刻' },
  { name: '大四喜', fan: 13, desc: '東南西北四刻' },
  { name: '字一色', fan: 13, desc: '全字牌' },
  { name: '十三幺', fan: 13, desc: '十三種么九' },
  { name: '十八羅漢', fan: 13, desc: '四槓子' },
  { name: '槓上槓', fan: 8, desc: '連續槓上開花' },
];

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    fullLiability: true,
    selfDrawMultiplier: 2,
    jackpotEnabled: false,
  });
  const [activeTab, setActiveTab] = useState<'score' | 'history' | 'stats' | 'settlement'>('score');
  
  const [showNewRound, setShowNewRound] = useState(false);
  const [dealerId, setDealerId] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const totalFan = selectedHands.reduce((sum, handName) => {
    const hand = HK_HAND_TYPES.find(h => h.name === handName);
    return sum + (hand?.fan || 0);
  }, isSelfDraw ? 1 : 0);

  useEffect(() => {
    if (gameId) fetchGameData();
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
        if (g.settings) {
          setSettings({
            fullLiability: g.settings.fullLiability ?? true,
            selfDrawMultiplier: g.settings.selfDrawMultiplier ?? 2,
            jackpotEnabled: g.settings.jackpotEnabled ?? false,
          });
        }
      }
    }
    
    if (roundsRes.ok) setRounds(await roundsRes.json());
  }

  const currentDealer = players.find(p => p.is_dealer);
  
  function calculateScore(): { points: number; breakdown: string } {
    let base = totalFan;
    if (isSelfDraw) base = base * settings.selfDrawMultiplier;
    const breakdown = `${totalFan}番 ${isSelfDraw ? `x ${settings.selfDrawMultiplier} (自摸)` : ''}`;
    return { points: base, breakdown };
  }

  async function addRound(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) { alert('請選擇食糊玩家'); return; }
    if (!isSelfDraw && !loserId) { alert('請選擇出統玩家'); return; }
    
    const { points } = calculateScore();
    const roundData = {
      dealer_id: parseInt(dealerId) || currentDealer?.id,
      winner_ids: [parseInt(winnerId)],
      loser_id: isSelfDraw ? null : parseInt(loserId),
      is_self_draw: isSelfDraw,
      hand_types: selectedHands.map(name => ({ name, tai: HK_HAND_TYPES.find(h => h.name === name)?.fan || 0 })),
      base_tai: totalFan,
      total_points: points,
      notes
    };
    
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
    setWinnerId('');
    setLoserId('');
    setIsSelfDraw(false);
    setSelectedHands([]);
    setNotes('');
  }

  function toggleHand(handName: string) {
    if (selectedHands.includes(handName)) {
      setSelectedHands(selectedHands.filter(h => h !== handName));
    } else {
      setSelectedHands([...selectedHands, handName]);
    }
  }

  async function undoLastRound() {
    if (!confirm('確定要取消上一局嗎?')) return;
    const res = await fetch(`/api/games/${gameId}/undo`, { method: 'POST' });
    if (res.ok) fetchGameData();
  }

  async function endGame() {
    if (!confirm('確定要結束這局遊戲嗎?')) return;
    const res = await fetch('/api/games', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(gameId), status: 'completed' })
    });
    if (res.ok) fetchGameData();
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center bg-red-900 text-white">加載中...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-rose-900">
      <header className="bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/70 hover:text-white">← 返回</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">🇭🇰 {game.name}</h1>
                <p className="text-sm text-white/60">
                  香港麻雀 · 第 {game.current_round} 局 · {game.current_wind}風
                  {game.dealer_repeat > 0 && ` (連${game.dealer_repeat})`}
                  {' · '}{settings.fullLiability ? '全銃' : '半銃'}
                  {' · '}自摸{settings.selfDrawMultiplier}x
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {game.status === 'active' && (
                <>
                  <button onClick={undoLastRound} disabled={rounds.length === 0}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-30">↩️ 還原</button>
                  <button onClick={endGame} className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500">結束牌局</button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Scoreboard */}
        <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">📊 香港麻雀計分板</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map(p => (
              <div key={p.id} className={`p-4 rounded-xl text-center ${p.is_dealer ? 'bg-red-600 text-white shadow-lg' : 'bg-white/95'}`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{WIND_EMOJI[getWind(p.seat_position)]}</span>
                  <span className="font-bold text-lg">{p.name}</span>
                  {p.is_dealer && <span className="text-xs bg-white/30 px-2 py-0.5 rounded">莊</span>}
                </div>
                <p className={`text-3xl font-bold ${p.final_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.final_score > 0 ? '+' : ''}{p.final_score}
                </p>
                <div className="text-xs mt-1 space-x-2 text-gray-600">
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
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === tab ? 'bg-white text-red-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {tab === 'score' && '🀄 計分'}
              {tab === 'history' && '📜 牌局紀錄'}
              {tab === 'stats' && '📈 統計'}
            </button>
          ))}
        </div>

        {/* Score Tab */}
        {activeTab === 'score' && game.status === 'active' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {!showNewRound ? (
              <button onClick={() => setShowNewRound(true)}
                className="w-full p-8 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl">➕</span>
                  <span className="text-2xl font-bold">記錄新一鋪</span>
                </div>
              </button>
            ) : (
              <form onSubmit={addRound} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">🇭🇰 香港麻雀記分</h3>
                  <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="mb-6 p-4 bg-red-50 rounded-lg text-sm text-red-800">
                  <span className="font-bold">目前設定:</span>
                  {' '}{settings.fullLiability ? '全銃' : '半銃'}
                  {' · '}自摸{settings.selfDrawMultiplier}倍
                </div>

                {/* Self Draw */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                    <input type="checkbox" checked={isSelfDraw} onChange={(e) => setIsSelfDraw(e.target.checked)} className="w-6 h-6" />
                    <div>
                      <span className="font-bold text-lg">自摸</span>
                      <p className="text-sm text-gray-500">{isSelfDraw ? `計分時會 × ${settings.selfDrawMultiplier}` : '點選如果是自摸'}</p>
                    </div>
                  </label>
                </div>

                {/* Winner */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">{isSelfDraw ? '自摸玩家' : '食糊玩家'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map(p => (
                      <button key={p.id} type="button" onClick={() => setWinnerId(p.id.toString())}
                        className={`p-3 rounded-lg border-2 transition text-left ${winnerId === p.id.toString() ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}>
                        <span className="text-xl mr-2">{WIND_EMOJI[getWind(p.seat_position)]}</span>
                        {p.name}
                        {p.is_dealer && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">莊</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loser */}
                {!isSelfDraw && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      出統玩家
                      <span className="text-gray-400 ml-2">({settings.fullLiability ? '全銃' : '半銃'})</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {players.filter(p => p.id.toString() !== winnerId).map(p => (
                        <button key={p.id} type="button" onClick={() => setLoserId(p.id.toString())}
                          className={`p-3 rounded-lg border-2 transition text-left ${loserId === p.id.toString() ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-300'}`}>
                          <span className="text-xl mr-2">{WIND_EMOJI[getWind(p.seat_position)]}</span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hand Types */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">牌型/番種</label>
                    <span className={`text-lg font-bold ${totalFan >= 3 ? 'text-red-600' : 'text-green-600'}`}>合計: {totalFan} 番</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['雞胡', '無花', '正花', '自摸', '碰碰胡', '混一色', '清一色'].map(hand => (
                      <button key={hand} type="button" onClick={() => toggleHand(hand)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${selectedHands.includes(hand) ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {hand}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {HK_HAND_TYPES.map(hand => (
                      <button key={hand.name} type="button" onClick={() => toggleHand(hand.name)}
                        className={`p-2 rounded text-sm text-left transition ${selectedHands.includes(hand.name) ? 'bg-red-500 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{hand.name}</span>
                          <span className={`text-xs ${selectedHands.includes(hand.name) ? 'text-white/80' : 'text-gray-500'}`}>{hand.fan} 番</span>
                        </div>
                        <p className={`text-xs ${selectedHands.includes(hand.name) ? 'text-white/60' : 'text-gray-400'}`}>{hand.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {totalFan > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800 mb-1">預覽計分</p>
                    <p className="text-2xl font-bold text-green-600">{calculateScore().points} 分</p>
                    <p className="text-sm text-green-600">{calculateScore().breakdown}</p>
                  </div>
                )}

                <button type="submit" disabled={!winnerId || (!isSelfDraw && !loserId)}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
                  {winnerId ? `確認記錄 (${calculateScore().points}分)` : '請選擇食糊玩家'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-red-50 to-rose-50">
              <h3 className="font-bold text-lg">🇭🇰 牌局紀錄</h3>
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
                          <span className="font-bold">第 {idx + 1} 鋪</span>
                          <span className="text-sm text-gray-500">{round.round_wind}風 {round.hand_number}局</span>
                          <span className="text-sm text-gray-400">莊: {round.dealer_name}</span>
                        </div>
                        <div className="text-sm">
                          {round.winners?.map(w => (
                            <span key={w.id} className="text-green-600 font-medium mr-2">{w.name} 食糊</span>
                          ))}
                          {round.loser_name && <span className="text-red-500">← {round.loser_name} 出統</span>}
                          {round.is_self_draw && <span className="text-amber-600 ml-2">(自摸)</span>}
                        </div>
                        {round.hand_type && <div className="text-sm text-gray-500 mt-1">{round.hand_type}</div>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">{round.base_tai} 番</p>
                        <p className="text-lg text-gray-600">{round.total_points} 分</p>
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
            <h3 className="font-bold text-lg mb-4">🇭🇰 本局統計</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {players.map(p => (
                <div key={p.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{WIND_EMOJI[getWind(p.seat_position)]}</span>
                    <span className="font-bold">{p.name}</span>
                    {p.is_dealer && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">莊</span>}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">食糊</span><span className="font-medium">{p.wins}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">自摸</span><span className="font-medium">{p.self_draws}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">出統</span><span className="font-medium text-red-500">{p.deal_ins}</span></div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500">分數</span>
                      <span className={`font-bold ${p.final_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.final_score > 0 ? '+' : ''}{p.final_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="font-bold mb-3">🏆 稱號</h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const winKing = players.reduce((max, p) => p.wins > max.wins ? p : max, players[0]);
                  const drawKing = players.reduce((max, p) => p.self_draws > max.self_draws ? p : max, players[0]);
                  const dealKing = players.reduce((max, p) => p.deal_ins > max.deal_ins ? p : max, players[0]);
                  return (
                    <>
                      {winKing?.wins > 0 && <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full font-medium">🏆 食糊王: {winKing.name} ({winKing.wins}次)</span>}
                      {drawKing?.self_draws > 0 && <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">🎯 自摸王: {drawKing.name} ({drawKing.self_draws}次)</span>}
                      {dealKing?.deal_ins > 0 && <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium">💥 出統王: {dealKing.name} ({dealKing.deal_ins}次)</span>}
                    </>
                  );
                })()}
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

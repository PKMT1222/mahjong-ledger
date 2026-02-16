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
  winners: { id: number; name: string }[];
  loser_name: string;
  is_self_draw: boolean;
  hand_type: string;
  base_tai: number;
  total_points: number;
}

// HK hand types
const HK_HANDS = [
  { name: '雞胡', fan: 0 },
  { name: '無花', fan: 1 },
  { name: '正花', fan: 1 },
  { name: '自摸', fan: 1 },
  { name: '碰碰胡', fan: 3 },
  { name: '混一色', fan: 3 },
  { name: '槓上開花', fan: 3 },
  { name: '七對', fan: 4 },
  { name: '清一色', fan: 7 },
  { name: '混么九', fan: 7 },
  { name: '大三元', fan: 8 },
  { name: '大四喜', fan: 13 },
];

const WINDS = ['東', '南', '西', '北'];

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showRecord, setShowRecord] = useState(false);
  
  // Form state
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [selectedHands, setSelectedHands] = useState<string[]>([]);

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
      if (g) setPlayers(g.players || []);
    }
    
    if (roundsRes.ok) setRounds(await roundsRes.json());
  }

  const totalFan = selectedHands.reduce((sum, handName) => {
    const hand = HK_HANDS.find(h => h.name === handName);
    return sum + (hand?.fan || 0);
  }, isSelfDraw ? 1 : 0);

  function calculateScore() {
    return isSelfDraw ? totalFan * 2 : totalFan;
  }

  async function recordRound(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) return;
    if (!isSelfDraw && !loserId) return;
    
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner_ids: [parseInt(winnerId)],
        loser_id: isSelfDraw ? null : parseInt(loserId),
        is_self_draw: isSelfDraw,
        hand_types: selectedHands.map(name => ({ name, tai: HK_HANDS.find(h => h.name === name)?.fan || 0 })),
        base_tai: totalFan,
        total_points: calculateScore()
      })
    });
    
    if (res.ok) {
      setShowRecord(false);
      setWinnerId('');
      setLoserId('');
      setIsSelfDraw(false);
      setSelectedHands([]);
      fetchGameData();
    }
  }

  function toggleHand(handName: string) {
    if (selectedHands.includes(handName)) {
      setSelectedHands(selectedHands.filter(h => h !== handName));
    } else {
      setSelectedHands([...selectedHands, handName]);
    }
  }

  async function undoLast() {
    if (!confirm('取消上一鋪?')) return;
    await fetch(`/api/games/${gameId}/undo`, { method: 'POST' });
    fetchGameData();
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-white">← 返回</Link>
          <h1 className="text-lg font-bold">{game.name}</h1>
          <button onClick={undoLast} className="text-xs bg-red-800 px-2 py-1 rounded">還原</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Scoreboard - 4 players */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center mb-3 text-sm text-gray-500">
            第 {game.current_round} 局 · {game.current_wind}風
            {game.dealer_repeat > 0 && ` (連${game.dealer_repeat})`}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {players.map((p, i) => (
              <div key={p.id} className={`text-center p-2 rounded ${p.is_dealer ? 'bg-red-100' : 'bg-gray-50'}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {WINDS[i]}{p.is_dealer ? '莊' : ''}
                </div>
                <div className="font-bold text-sm truncate">{p.name}</div>
                <div className={`text-lg font-bold ${p.final_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {p.final_score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record Button */}
        {!showRecord ? (
          <button 
            onClick={() => setShowRecord(true)}
            className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg"
          >
            + 記分
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">記錄得分</h3>
              <button onClick={() => setShowRecord(false)} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={recordRound} className="space-y-4">
              {/* Self Draw Toggle */}
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isSelfDraw}
                  onChange={(e) => setIsSelfDraw(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-medium">自摸 (x2)</span>
              </label>

              {/* Winner */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">{isSelfDraw ? '自摸' : '食糊'}</label>
                <div className="grid grid-cols-4 gap-2">
                  {players.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWinnerId(p.id.toString())}
                      className={`p-2 rounded text-center text-sm ${
                        winnerId === p.id.toString() 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100'
                      }`}
                    >
                      {WINDS[p.seat_position - 1]}<br/>{p.name.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loser (if not self draw) */}
              {!isSelfDraw && (
                <div>
                  <label className="text-sm text-gray-600 block mb-2">出統</label>
                  <div className="grid grid-cols-4 gap-2">
                    {players.filter(p => p.id.toString() !== winnerId).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setLoserId(p.id.toString())}
                        className={`p-2 rounded text-center text-sm ${
                          loserId === p.id.toString() 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100'
                        }`}
                      >
                        {WINDS[p.seat_position - 1]}<br/>{p.name.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hand Types */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">牌型</label>
                  <span className="text-red-600 font-bold">{totalFan} 番</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HK_HANDS.map(hand => (
                    <button
                      key={hand.name}
                      type="button"
                      onClick={() => toggleHand(hand.name)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedHands.includes(hand.name)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      {hand.name} {hand.fan > 0 && `${hand.fan}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score Preview */}
              {totalFan > 0 && (
                <div className="p-3 bg-yellow-50 rounded text-center">
                  <span className="text-2xl font-bold text-red-600">{calculateScore()}</span>
                  <span className="text-gray-600 ml-2">分</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={!winnerId || (!isSelfDraw && !loserId)}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
              >
                確認 {calculateScore() > 0 && `(${calculateScore()}分)`}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">紀錄 ({rounds.length}鋪)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...rounds].reverse().map((round, idx) => (
              <div key={round.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1">
                  <span className="text-gray-400 mr-2">#{rounds.length - idx}</span>
                  {round.winners?.map(w => (
                    <span key={w.id} className="text-red-600 font-medium">{w.name}</span>
                  ))}
                  {!round.is_self_draw && round.loser_name && (
                    <span className="text-gray-500"> ← {round.loser_name}</span>
                  )}
                  {round.is_self_draw && <span className="text-amber-600 ml-1">(自摸)</span>}
                </div>
                <div className="text-right">
                  <div className="font-bold">{round.total_points}</div>
                  <div className="text-xs text-gray-400">{round.base_tai}番</div>
                </div>
              </div>
            ))}
            {rounds.length === 0 && (
              <p className="text-gray-400 text-center py-4">暫無紀錄</p>
            )}
          </div>
        </div>

        {/* End Game */}
        <button 
          onClick={async () => {
            if (confirm('結束牌局?')) {
              await fetch('/api/games', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(gameId), status: 'completed' })
              });
              fetchGameData();
            }
          }}
          className="w-full py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium"
        >
          結束牌局
        </button>
      </main>
    </div>
  );
}

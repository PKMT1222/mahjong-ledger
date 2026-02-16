'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  is_bao_zimo: boolean;
}

// 香港麻雀番種表 (Hong Kong Mahjong Hand Types)
const HK_HAND_TYPES = [
  // 基本番種
  { name: '雞胡', fan: 0, category: 'basic', desc: '普通胡牌' },
  { name: '無花', fan: 1, category: 'flower', desc: '沒有花牌' },
  { name: '正花', fan: 1, category: 'flower', desc: '正位花牌' },
  { name: '花胡', fan: 3, category: 'flower', desc: '集齊8隻花' },
  
  // 門前清/自摸
  { name: '自摸', fan: 1, category: 'win', desc: '自己摸糊' },
  { name: '門前清', fan: 1, category: 'basic', desc: '沒有碰/上家的吃' },
  
  // 槓相關
  { name: '槓上開花', fan: 3, category: 'kong', desc: '槓牌後摸糊' },
  { name: '搶槓', fan: 3, category: 'kong', desc: '搶別人加槓' },
  { name: '槓上槓', fan: 8, category: 'kong', desc: '連續槓上開花' },
  
  // 特殊糊法
  { name: '海底撈月', fan: 3, category: 'special', desc: '最後一隻牌自摸' },
  { name: '河底撈魚', fan: 3, category: 'special', desc: '最後一隻牌出統' },
  
  // 對子/刻子相關
  { name: '碰碰胡', fan: 3, category: 'combination', desc: '全對對/刻子' },
  { name: '三暗刻', fan: 3, category: 'combination', desc: '三組暗刻' },
  { name: '四暗刻', fan: 13, category: 'combination', desc: '四組暗刻' },
  { name: '十八羅漢', fan: 13, category: 'combination', desc: '四槓子' },
  
  // 花色相關
  { name: '混一色', fan: 3, category: 'suit', desc: '一色+字牌' },
  { name: '清一色', fan: 7, category: 'suit', desc: '同一花色' },
  
  // 么九相關
  { name: '混么九', fan: 7, category: 'terminal', desc: '么九+字牌' },
  { name: '清么九', fan: 7, category: 'terminal', desc: '全么九' },
  
  // 對子相關
  { name: '七對', fan: 4, category: 'combination', desc: '七對子' },
  
  // 三元牌
  { name: '小三元', fan: 5, category: 'honor', desc: '中發白兩刻+一對' },
  { name: '大三元', fan: 8, category: 'honor', desc: '中發白三刻' },
  
  // 風牌
  { name: '小四喜', fan: 10, category: 'honor', desc: '東南西北三刻+一對' },
  { name: '大四喜', fan: 13, category: 'honor', desc: '東南西北四刻' },
  
  // 字一色
  { name: '字一色', fan: 13, category: 'honor', desc: '全字牌' },
  
  // 十三么
  { name: '十三么', fan: 13, category: 'special', desc: '十三種么九' },
  
  // 天/地/人胡
  { name: '天胡', fan: 13, category: 'limit', desc: '莊家起手即糊' },
  { name: '地胡', fan: 13, category: 'limit', desc: '閒家第一圈摸糊' },
  { name: '人胡', fan: 13, category: 'limit', desc: '閒家第一圈食出統' },
];

const WINDS = ['東', '南', '西', '北'];

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showRecord, setShowRecord] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'stats'>('record');
  
  // Form state
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [isBaoZimo, setIsBaoZimo] = useState(false);
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [handFilter, setHandFilter] = useState('all');

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

  // Calculate total fan
  const totalFan = selectedHands.reduce((sum, handName) => {
    const hand = HK_HAND_TYPES.find(h => h.name === handName);
    return sum + (hand?.fan || 0);
  }, 0);

  // Calculate final score with multipliers
  function calculateFinalScore(): { base: number; final: number; breakdown: string } {
    let base = totalFan;
    let breakdown = `${base}番`;
    
    // Self draw adds 1 fan and doubles
    if (isSelfDraw) {
      base = (base + 1) * 2;
      breakdown += ' + 自摸 x2';
    }
    
    // Bao zimo (包自摸) - loser pays all
    // This is handled in distribution, not score calculation
    
    return { base: totalFan, final: base, breakdown };
  }

  async function recordRound(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) { alert('請選擇食糊玩家'); return; }
    if (!isSelfDraw && !loserId) { alert('請選擇出統玩家'); return; }
    
    const score = calculateFinalScore();
    
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner_ids: [parseInt(winnerId)],
        loser_id: isSelfDraw ? null : parseInt(loserId),
        is_self_draw: isSelfDraw,
        is_bao_zimo: isBaoZimo,
        hand_types: selectedHands.map(name => ({ 
          name, 
          tai: HK_HAND_TYPES.find(h => h.name === name)?.fan || 0 
        })),
        base_tai: totalFan,
        total_points: score.final,
        notes
      })
    });
    
    if (res.ok) {
      resetForm();
      fetchGameData();
    }
  }

  function resetForm() {
    setShowRecord(false);
    setWinnerId('');
    setLoserId('');
    setIsSelfDraw(false);
    setIsBaoZimo(false);
    setSelectedHands([]);
    setNotes('');
  }

  function toggleHand(handName: string) {
    if (selectedHands.includes(handName)) {
      setSelectedHands(selectedHands.filter(h => h !== handName));
    } else {
      // Check mutually exclusive hands
      const hand = HK_HAND_TYPES.find(h => h.name === handName);
      if (hand) {
        // Remove conflicting hands
        const conflicts: { [key: string]: string[] } = {
          '雞胡': ['碰碰胡', '混一色', '清一色', '混么九', '清么九', '七對', '小三元', '大三元', '小四喜', '大四喜', '字一色', '十三么'],
          '清一色': ['混一色', '混么九'],
          '大三元': ['小三元'],
          '大四喜': ['小四喜'],
          '清么九': ['混么九'],
        };
        
        const toRemove = conflicts[handName] || [];
        const filtered = selectedHands.filter(h => !toRemove.includes(h));
        setSelectedHands([...filtered, handName]);
      }
    }
  }

  async function undoLast() {
    if (!confirm('取消上一鋪?')) return;
    await fetch(`/api/games/${gameId}/undo`, { method: 'POST' });
    fetchGameData();
  }

  function getPaymentBreakdown() {
    const score = calculateFinalScore().final;
    const winner = players.find(p => p.id.toString() === winnerId);
    const loser = players.find(p => p.id.toString() === loserId);
    
    if (isSelfDraw) {
      // Self draw: everyone pays
      if (isBaoZimo && loser) {
        return `包自摸: ${loser.name} 全付 ${score * 3}`;
      }
      return `自摸: 其他3人各付 ${score}`;
    } else {
      // Discard
      return `出統: ${loser?.name || '出統者'} 付 ${score}`;
    }
  }

  // Filter hands by category
  const filteredHands = handFilter === 'all' 
    ? HK_HAND_TYPES 
    : HK_HAND_TYPES.filter(h => h.category === handFilter);

  // Group hands by category for display
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'basic', name: '基本' },
    { id: 'flower', name: '花牌' },
    { id: 'win', name: '食糊' },
    { id: 'kong', name: '槓' },
    { id: 'suit', name: '花色' },
    { id: 'combination', name: '組合' },
    { id: 'honor', name: '番子' },
    { id: 'terminal', name: '么九' },
    { id: 'special', name: '特殊' },
    { id: 'limit', name: '滿貫' },
  ];

  if (!game) return <div className="min-h-screen flex items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <div className="text-center">
            <h1 className="font-bold">{game.name}</h1>
            <p className="text-xs opacity-80">
              第{game.current_round}局 · {game.current_wind}風
              {game.dealer_repeat > 0 && `(連${game.dealer_repeat})`}
            </p>
          </div>
          <button onClick={undoLast} className="text-xs bg-red-800 px-2 py-1 rounded">還原</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Scoreboard */}
        <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            {players.map((p, i) => (
              <div key={p.id} className={`p-3 text-center ${p.is_dealer ? 'bg-red-50' : ''}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {WINDS[i]}{p.is_dealer ? '莊' : ''}
                </div>
                <div className="font-bold text-sm truncate">{p.name}</div>
                <div className={`text-xl font-bold ${p.final_score > 0 ? 'text-red-600' : p.final_score < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {p.final_score > 0 ? '+' : ''}{p.final_score}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  🏆{p.wins} 🎯{p.self_draws}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-lg shadow mb-4 overflow-hidden">
          {[
            { id: 'record', label: '📝 記分' },
            { id: 'history', label: '📜 紀錄' },
            { id: 'stats', label: '📊 統計' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && (
          <div className="bg-white rounded-lg shadow p-4">
            {!showRecord ? (
              <button 
                onClick={() => setShowRecord(true)}
                className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg"
              >
                + 記錄新一鋪
              </button>
            ) : (
              <form onSubmit={recordRound} className="space-y-4">
                {/* Win Type */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSelfDraw(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      !isSelfDraw ? 'bg-red-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    食出統
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSelfDraw(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      isSelfDraw ? 'bg-red-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    自摸 (+1番 x2)
                  </button>
                </div>

                {/* Winner Selection */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">食糊玩家</label>
                  <div className="grid grid-cols-4 gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setWinnerId(p.id.toString())}
                        className={`p-3 rounded-lg text-center ${
                          winnerId === p.id.toString() 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100'
                        }`}
                      >
                        <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                        <div className="font-bold text-sm">{p.name.slice(0, 2)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loser Selection (if not self draw) */}
                {!isSelfDraw && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">出統玩家</label>
                    <div className="grid grid-cols-4 gap-2">
                      {players.filter(p => p.id.toString() !== winnerId).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setLoserId(p.id.toString())}
                          className={`p-3 rounded-lg text-center ${
                            loserId === p.id.toString() 
                              ? 'bg-red-500 text-white' 
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                          <div className="font-bold text-sm">{p.name.slice(0, 2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bao Zimo (if self draw) */}
                {isSelfDraw && (
                  <label className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBaoZimo}
                      onChange={(e) => setIsBaoZimo(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">包自摸 (出統者全付)</span>
                  </label>
                )}

                {/* Hand Types Filter */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">番種 ({totalFan}番)</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setHandFilter(cat.id)}
                        className={`px-2 py-1 rounded text-xs ${
                          handFilter === cat.id 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Hand Types Grid */}
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {filteredHands.map(hand => (
                      <button
                        key={hand.name}
                        type="button"
                        onClick={() => toggleHand(hand.name)}
                        className={`p-2 rounded text-center text-sm ${
                          selectedHands.includes(hand.name)
                            ? 'bg-red-500 text-white'
                            : 'bg-white border'
                        }`}
                        title={hand.desc}
                      >
                        <div className="font-medium">{hand.name}</div>
                        <div className={`text-xs ${selectedHands.includes(hand.name) ? 'text-white/80' : 'text-gray-400'}`}>
                          {hand.fan}番
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Preview */}
                {totalFan > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-center mb-2">
                      <span className="text-3xl font-bold text-red-600">
                        {calculateFinalScore().final}
                      </span>
                      <span className="text-gray-600 ml-2">分</span>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      {calculateFinalScore().breakdown}
                    </div>
                    <div className="text-center text-xs text-gray-400 mt-1">
                      {getPaymentBreakdown()}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="備註 (可選)"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />

                {/* Submit */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecord(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!winnerId || (!isSelfDraw && !loserId)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold disabled:bg-gray-400"
                  >
                    確認記錄
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">牌局紀錄 ({rounds.length}鋪)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...rounds].reverse().map((round, idx) => (
                <div key={round.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">#{rounds.length - idx}</span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {round.round_wind}{round.hand_number}
                        </span>
                      </div>
                      <div className="text-sm">
                        {round.winners?.map(w => (
                          <span key={w.id} className="text-red-600 font-medium">{w.name}</span>
                        ))}
                        {!round.is_self_draw && round.loser_name && (
                          <span className="text-gray-500"> ← {round.loser_name}</span>
                        )}
                        {round.is_self_draw && (
                          <span className="text-amber-600 ml-1">
                            (自摸{round.is_bao_zimo ? ' 包' : ''})
                          </span>
                        )}
                      </div>
                      {round.hand_type && (
                        <div className="text-xs text-gray-500 mt-1">{round.hand_type}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{round.total_points}</div>
                      <div className="text-xs text-gray-400">{round.base_tai}番</div>
                    </div>
                  </div>
                </div>
              ))}
              {rounds.length === 0 && (
                <p className="text-gray-400 text-center py-8">暫無紀錄</p>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-4">牌局統計</h3>
            
            {/* Player Stats */}
            <div className="space-y-3 mb-6">
              {players.map((p, i) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {WINDS[i]}
                      </span>
                      <span className="font-bold">{p.name}</span>
                      {p.is_dealer && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">莊</span>}
                    </div>
                    <span className={`text-xl font-bold ${p.final_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {p.final_score > 0 ? '+' : ''}{p.final_score}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-400 text-xs">食糊</div>
                      <div className="font-bold">{p.wins}</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-400 text-xs">自摸</div>
                      <div className="font-bold">{p.self_draws}</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-400 text-xs">出統</div>
                      <div className="font-bold text-red-500">{p.deal_ins}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Titles */}
            <div className="border-t pt-4">
              <h4 className="font-bold mb-2">🏆 稱號</h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sortedByWins = [...players].sort((a, b) => b.wins - a.wins);
                  const sortedBySelfDraws = [...players].sort((a, b) => b.self_draws - a.self_draws);
                  const sortedByDealIns = [...players].sort((a, b) => b.deal_ins - a.deal_ins);
                  
                  return (
                    <>
                      {sortedByWins[0]?.wins > 0 && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          🏆 食糊王: {sortedByWins[0].name}
                        </span>
                      )}
                      {sortedBySelfDraws[0]?.self_draws > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          🎯 自摸王: {sortedBySelfDraws[0].name}
                        </span>
                      )}
                      {sortedByDealIns[0]?.deal_ins > 0 && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          💥 出統王: {sortedByDealIns[0].name}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Settlement Preview */}
            {players.length === 4 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-bold mb-2">💰 找數預覽</h4>
                <div className="space-y-2 text-sm">
                  {players
                    .sort((a, b) => b.final_score - a.final_score)
                    .map((p, i) => {
                      const isWinner = p.final_score > 0;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">#{i + 1}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <span className={isWinner ? 'text-red-600 font-bold' : 'text-green-600'}>
                            {p.final_score > 0 ? '收' : '付'} {Math.abs(p.final_score)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

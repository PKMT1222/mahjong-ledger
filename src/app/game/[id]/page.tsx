'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  VARIANT_CONFIGS, 
  HAND_TYPES_BY_VARIANT, 
  calculateScore,
  GameVariant 
} from '@/lib/mahjongRules';
import {
  calculateCustomScore,
  GameRule,
  getRuleById
} from '@/lib/customRules';

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

const WINDS = ['東', '南', '西', '北'];

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showRecord, setShowRecord] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'stats'>('record');
  
  // Get variant config
  const variant: GameVariant = game?.variant || 'hongkong';
  const config = VARIANT_CONFIGS[variant];
  const handTypes = HAND_TYPES_BY_VARIANT[variant];
  
  // Check if using custom rule
  const customRule: GameRule | null = game?.settings?.ruleId ? {
    id: game.settings.ruleId,
    name: game.settings.ruleName,
    isPreset: game.settings.ruleId.startsWith('preset-'),
    fullShoot: game.settings.fullShoot,
    jackpotEnabled: game.settings.jackpotEnabled,
    recordDealer: game.settings.recordDealer,
    passDealerOnDraw: game.settings.passDealerOnDraw,
    minFan: game.settings.minFan,
    maxFan: game.settings.maxFan,
    selfDrawMultiplier: game.settings.selfDrawMultiplier,
    fanPoints: game.settings.fanPoints,
  } : null;
  
  // Form state
  const [winnerId, setWinnerId] = useState('');
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [isBaoZimo, setIsBaoZimo] = useState(false);
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [fu, setFu] = useState(30); // For Japanese mahjong
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

  // Calculate total value (tai/han)
  const totalValue = selectedHands.reduce((sum, handName) => {
    const hand = handTypes.find(h => h.name === handName);
    return sum + (hand?.value || 0);
  }, 0);

  // Calculate score using variant-specific logic or custom rule
  function calculateFinalScore(): { 
    base: number; 
    final: number; 
    breakdown: string;
    payments: { winner: number; losers: number };
  } {
    const currentDealer = players.find(p => p.is_dealer);
    const isDealer = winnerId === currentDealer?.id.toString();
    
    // Use custom rule if available
    if (customRule) {
      const result = calculateCustomScore(
        customRule,
        totalValue,
        isSelfDraw,
        isDealer || false
      );
      
      return {
        base: totalValue,
        final: result.winnerPoints,
        breakdown: result.breakdown,
        payments: {
          winner: result.winnerPoints,
          losers: result.loserPoints,
        }
      };
    }
    
    // Otherwise use variant default
    const result = calculateScore(variant, {
      value: totalValue,
      fu: config.useFu ? fu : undefined,
      isSelfDraw,
      isDealer: isDealer || false,
      dealerRepeat: game?.dealer_repeat || 0,
      honba: 0,
    }, config);
    
    return {
      base: totalValue,
      final: result.winnerPoints,
      breakdown: result.breakdown,
      payments: {
        winner: result.winnerPoints,
        losers: result.loserPoints,
      }
    };
  }

  async function recordRound(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) { alert('請選擇食糊玩家'); return; }
    if (!isSelfDraw && !loserId) { alert('請選擇出統玩家'); return; }
    if (config.useFu && (!fu || fu < 20)) { alert('請輸入有效符數 (20+)'); return; }
    
    const score = calculateFinalScore();
    
    // Get current dealer
    let currentDealer = players.find(p => p.is_dealer);
    if (!currentDealer && players.length > 0) {
      currentDealer = players[0];
    }
    
    if (!currentDealer) {
      alert('無法找到莊家信息');
      return;
    }
    
    const requestData = {
      dealer_id: currentDealer.id,
      winner_ids: [parseInt(winnerId)],
      loser_id: isSelfDraw ? null : parseInt(loserId),
      is_self_draw: isSelfDraw,
      is_bao_zimo: isBaoZimo,
      hand_types: selectedHands.map(name => ({ 
        name, 
        tai: handTypes.find(h => h.name === name)?.value || 0 
      })),
      base_tai: totalValue,
      fu: config.useFu ? fu : null,
      total_points: score.final,
      notes: notes || '',
      // Include custom rule info if using
      rule_id: customRule?.id,
      rule_name: customRule?.name,
    };
    
    console.log('Submitting round data:', requestData);
    
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (res.ok) {
      resetForm();
      fetchGameData();
    } else {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        const text = await res.text();
        errorMessage = text || `HTTP ${res.status}`;
      }
      alert('記錄失敗: ' + errorMessage);
      console.error('Record error:', errorMessage);
    }
  }

  function resetForm() {
    setShowRecord(false);
    setWinnerId('');
    setLoserId('');
    setIsSelfDraw(false);
    setIsBaoZimo(false);
    setSelectedHands([]);
    setFu(30);
    setNotes('');
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

  // Filter hands by category
  const categories = [...new Set(handTypes.map(h => h.category))];
  const filteredHands = handFilter === 'all' 
    ? handTypes 
    : handTypes.filter(h => h.category === handFilter);

  // Get category name
  const getCategoryName = (cat: string) => {
    const names: { [key: string]: string } = {
      basic: '基本',
      flower: '花牌',
      win: '食糊',
      kong: '槓',
      special: '特殊',
      combination: '組合',
      suit: '花色',
      terminal: '么九',
      honor: '番子',
      limit: '滿貫',
      yakuman: '役満',
      yaku: '役種',
    };
    return names[cat] || cat;
  };

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
              {config.name} · 第{game.current_round}局 · {game.current_wind}風
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
                  {p.final_score}
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
              className={`flex-1 py-3 text-sm font-medium ${activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && game.status === 'active' && (
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
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${!isSelfDraw ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                  >
                    {variant === 'japanese' ? '榮和 (Ron)' : '食出統'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSelfDraw(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${isSelfDraw ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                  >
                    {variant === 'japanese' ? '自摸 (Tsumo)' : '自摸'}
                  </button>
                </div>

                {/* Winner Selection */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    {variant === 'japanese' ? '和了者' : '食糊玩家'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setWinnerId(p.id.toString())}
                        className={`p-3 rounded-lg text-center ${winnerId === p.id.toString() ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                      >
                        <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                        <div className="font-bold text-sm">{p.name.slice(0, 2)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loser Selection */}
                {!isSelfDraw && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      {variant === 'japanese' ? '放銃者' : '出統玩家'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {players.filter(p => p.id.toString() !== winnerId).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setLoserId(p.id.toString())}
                          className={`p-3 rounded-lg text-center ${loserId === p.id.toString() ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                        >
                          <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                          <div className="font-bold text-sm">{p.name.slice(0, 2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Japanese Fu Input */}
                {config.useFu && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">符數 (Fu)</label>
                    <select
                      value={fu}
                      onChange={(e) => setFu(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value={20}>20符</option>
                      <option value={25}>25符</option>
                      <option value={30}>30符</option>
                      <option value={40}>40符</option>
                      <option value={50}>50符</option>
                      <option value={60}>60符</option>
                      <option value={70}>70符</option>
                      <option value={80}>80符</option>
                      <option value={90}>90符</option>
                      <option value={100}>100符</option>
                      <option value={110}>110符</option>
                    </select>
                  </div>
                )}

                {/* Bao Zimo for HK */}
                {variant === 'hongkong' && isSelfDraw && (
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

                {/* Hand Types */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">
                      {config.scoringUnit === '台' ? '台數' : config.scoringUnit === '番' ? '番數' : '分數'} 
                      <span className="text-red-600 font-bold ml-2">{totalValue} {config.scoringUnit}</span>
                    </label>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <button
                      onClick={() => setHandFilter('all')}
                      className={`px-2 py-1 rounded text-xs ${handFilter === 'all' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                    >
                      全部
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setHandFilter(cat)}
                        className={`px-2 py-1 rounded text-xs ${handFilter === cat ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                      >
                        {getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Hand Types Grid */}
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {filteredHands.map(hand => (
                      <button
                        key={hand.name}
                        type="button"
                        onClick={() => toggleHand(hand.name)}
                        className={`p-2 rounded text-center text-sm ${selectedHands.includes(hand.name) ? 'bg-red-500 text-white' : 'bg-white border'}`}
                      >
                        <div className="font-medium">{hand.name}</div>
                        <div className={`text-xs ${selectedHands.includes(hand.name) ? 'text-white/80' : 'text-gray-500'}`}>
                          {hand.value} {config.scoringUnit}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Preview */}
                {totalValue > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-center mb-2">
                      <span className="text-3xl font-bold text-red-600">{calculateFinalScore().final}</span>
                      <span className="text-gray-600 ml-2">分</span>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      {calculateFinalScore().breakdown}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="備註 (可選)"
                  className="w-full px-3 py-2 border rounded-lg"
                />

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRecord(false)} className="flex-1 py-3 bg-gray-200 rounded-lg">
                    取消
                  </button>
                  <button 
                    type="submit" 
                    disabled={!winnerId || (!isSelfDraw && !loserId)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold disabled:bg-gray-400"
                  >
                    確認 {calculateFinalScore().final > 0 && `(${calculateFinalScore().final}分)`}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* History & Stats tabs remain similar but use variant-specific display */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">牌局紀錄 ({rounds.length}鋪)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    <div className="font-bold">{round.total_points}分</div>
                    <div className="text-xs text-gray-400">{round.base_tai}{config.scoringUnit}</div>
                  </div>
                </div>
              ))}
              {rounds.length === 0 && <p className="text-gray-400 text-center py-4">暫無紀錄</p>}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-4">本局統計 ({config.name})</h3>
            <div className="grid grid-cols-2 gap-3">
              {players.map((p, i) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{WINDS[i]}</span>
                    <span className="font-bold">{p.name}</span>
                    {p.is_dealer && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">莊</span>}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">食糊</span><span>{p.wins}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">自摸</span><span>{p.self_draws}</span></div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-500">分數</span>
                      <span className={`font-bold ${p.final_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.final_score > 0 ? '+' : ''}{p.final_score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

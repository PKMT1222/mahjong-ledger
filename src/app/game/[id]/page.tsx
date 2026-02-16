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
import { AnimatedButton, AnimatedCard, IconButton, FadeIn } from '@/components/AnimatedElements';

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
  is_draw: boolean;
  pass_dealer: boolean;
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
  const [showDrawForm, setShowDrawForm] = useState(false);
  const [drawPassDealer, setDrawPassDealer] = useState(true);
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'stats'>('record');
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
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
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [loserId, setLoserId] = useState('');
  const [isSelfDraw, setIsSelfDraw] = useState(false);
  const [multipleWinnersMode, setMultipleWinnersMode] = useState(false);
  const [isBaoZimo, setIsBaoZimo] = useState(false);
  const [baoPayerId, setBaoPayerId] = useState('');
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [fu, setFu] = useState(30); // For Japanese mahjong
  const [notes, setNotes] = useState('');
  const [handFilter, setHandFilter] = useState('all');
  
  // Hand details state
  const [showHandDetails, setShowHandDetails] = useState(false);
  const [selectedHandType, setSelectedHandType] = useState('');
  const [customHandName, setCustomHandName] = useState('');
  const [handNotes, setHandNotes] = useState('');
  const [winningTile, setWinningTile] = useState('');
  const [isDealerWin, setIsDealerWin] = useState(false);

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

  // Calculate total value (tai/han) - per winner
  const calculateWinnerValue = (winnerId: string) => {
    // For now, all winners get same value
    // Could be extended to allow different hands per winner
    return selectedHands.reduce((sum, handName) => {
      const hand = handTypes.find(h => h.name === handName);
      return sum + (hand?.value || 0);
    }, 0);
  };

  const totalValue = calculateWinnerValue('');

  // Calculate score using variant-specific logic or custom rule
  function calculateFinalScore(): { 
    base: number; 
    final: number; 
    breakdown: string;
    payments: { winner: number; losers: number };
    totalWinners: number;
    selfDrawTotal?: number; // Total for bao self-draw
  } {
    const currentDealer = players.find(p => p.is_dealer);
    const isDealer = winnerIds.length === 1 && winnerIds[0] === currentDealer?.id.toString();
    
    // Use custom rule if available
    if (customRule) {
      // First calculate normal self-draw to get per-player payment
      const normalResult = calculateCustomScore(
        customRule,
        totalValue,
        false, // Calculate normal first to get base
        isDealer || false
      );
      
      // Then calculate self-draw
      const selfDrawResult = calculateCustomScore(
        customRule,
        totalValue,
        true,
        isDealer || false
      );
      
      // For bao self-draw: the total is the same as normal self-draw total
      // selfDrawResult.winnerPoints is already the total (per-player * 3 for 4-player game)
      // For bao, the payer pays this total amount
      const selfDrawTotal = selfDrawResult.winnerPoints;
      
      return {
        base: totalValue,
        final: selfDrawResult.winnerPoints, // Total for display
        breakdown: selfDrawResult.breakdown,
        payments: {
          winner: selfDrawResult.winnerPoints,
          losers: selfDrawResult.loserPoints,
        },
        totalWinners: winnerIds.length,
        selfDrawTotal
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
    
    // For bao self-draw: use the already calculated self-draw total
    // result.winnerPoints is already the total (per-player * 3 for 4-player game)
    const selfDrawTotal = result.winnerPoints;
    
    return {
      base: totalValue,
      final: result.winnerPoints,
      breakdown: result.breakdown,
      payments: {
        winner: result.winnerPoints,
        losers: result.loserPoints,
      },
      totalWinners: winnerIds.length,
      selfDrawTotal
    };
  }

  // Helper function to get bao self-draw total
  function getBaoSelfDrawTotal(): number {
    const score = calculateFinalScore();
    return score.selfDrawTotal || score.final * (players.length - 1);
  }

  async function recordRound(e: React.FormEvent) {
    e.preventDefault();
    if (winnerIds.length === 0) { alert('請選擇食糊玩家'); return; }
    if (!isSelfDraw && !loserId) { alert('請選擇出統玩家'); return; }
    if (config.useFu && (!fu || fu < 20)) { alert('請輸入有效符數 (20+)'); return; }
    if (isSelfDraw && winnerIds.length > 1) { alert('自摸時只能有一位贏家'); return; }
    if (isBaoZimo && !baoPayerId) { alert('請選擇包家'); return; }
    
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
      winner_ids: winnerIds.map(id => parseInt(id)),
      loser_id: isSelfDraw ? null : parseInt(loserId),
      is_self_draw: isSelfDraw,
      is_bao_zimo: isBaoZimo,
      bao_payer_id: isBaoZimo && baoPayerId ? parseInt(baoPayerId) : null,
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
      // Hand details
      hand_details: showHandDetails ? {
        hand_type_id: selectedHandType || null,
        hand_type_name: selectedHandType || null,
        custom_name: customHandName || null,
        winning_tile: winningTile || null,
        is_dealer: isDealerWin,
        notes: handNotes || null,
        fan_count: totalValue
      } : null
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
    setWinnerIds([]);
    setLoserId('');
    setIsSelfDraw(false);
    setIsBaoZimo(false);
    setBaoPayerId('');
    setMultipleWinnersMode(false);
    setSelectedHands([]);
    setFu(30);
    setNotes('');
    // Reset hand details
    setShowHandDetails(false);
    setSelectedHandType('');
    setCustomHandName('');
    setHandNotes('');
    setWinningTile('');
    setIsDealerWin(false);
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

  async function deleteRound(roundId: number) {
    if (!confirm('確定要刪除此回合嗎？\n\n⚠️ 刪除後將重新計算所有後續回合的分數')) return;
    
    try {
      const res = await fetch(`/api/games/${gameId}/rounds?id=${roundId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGameData();
        alert('✅ 回合已刪除');
      } else {
        const error = await res.json();
        alert('❌ 刪除失敗: ' + (error.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('❌ 刪除失敗: ' + error.message);
    }
  }

  function openEditModal(round: Round) {
    setEditingRound(round);
    // Initialize form with round data
    if (!round.is_draw) {
      setWinnerIds(round.winners?.map(w => w.id.toString()) || []);
      setIsSelfDraw(round.is_self_draw);
      setMultipleWinnersMode((round.winners?.length || 0) > 1);
      if (round.loser_name) {
        const loser = players.find(p => p.name === round.loser_name);
        if (loser) setLoserId(loser.id.toString());
      }
      setNotes(round.hand_type || '');
    }
    setShowEditModal(true);
  }

  async function recordDraw(e: React.FormEvent) {
    e.preventDefault();
    
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
      is_draw: true,
      pass_dealer: drawPassDealer,
      notes: '流局',
    };
    
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (res.ok) {
      setShowDrawForm(false);
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
      alert('記錄流局失敗: ' + errorMessage);
    }
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
              className={`flex-1 py-3 text-sm font-medium tab-press transition-all duration-150 ${
                activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && game.status === 'active' && (
          <div className="bg-white rounded-lg shadow p-4">
            {!showRecord && !showDrawForm ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowRecord(true)}
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg btn-ripple"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  + 記錄食糊
                </button>
                <button 
                  onClick={() => setShowDrawForm(true)}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium btn-press"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  🌊 記錄流局
                </button>
                <div className="border-t pt-3 mt-3">
                  <button 
                    onClick={() => {
                      if (confirm('確定要結束牌局嗎？\n\n結束後將進入找數頁面，不能再添加新回合。')) {
                        window.location.href = `/game/${gameId}/settlement`;
                      }
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium btn-press"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    ✅ 結束牌局
                  </button>
                </div>
              </div>
            ) : showDrawForm ? (
              <form onSubmit={recordDraw} className="space-y-4">
                <h3 className="font-bold text-lg">記錄流局</h3>
                
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drawPassDealer}
                    onChange={(e) => setDrawPassDealer(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">莊家過莊</div>
                    <div className="text-xs text-gray-500">流局後輪轉到下一位莊家</div>
                  </div>
                </label>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowDrawForm(false)} 
                    className="flex-1 py-3 bg-gray-200 rounded-lg btn-press"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-bold"
                  >
                    確認流局
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={recordRound} className="space-y-4">
                {/* Win Type */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsSelfDraw(false); setMultipleWinnersMode(false); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium btn-press ${!isSelfDraw && !multipleWinnersMode ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    食出統
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSelfDraw(true); setMultipleWinnersMode(false); setWinnerIds([]); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium btn-press ${isSelfDraw ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    自摸
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMultipleWinnersMode(true); setIsSelfDraw(false); setWinnerIds([]); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium btn-press ${multipleWinnersMode ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    多贏家
                  </button>
                </div>

                {/* Winner Selection */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">
                    {isSelfDraw ? '自摸玩家' : multipleWinnersMode ? '食糊玩家 (可多選)' : '食糊玩家'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isSelfDraw) {
                            setWinnerIds([p.id.toString()]);
                          } else if (multipleWinnersMode) {
                            if (winnerIds.includes(p.id.toString())) {
                              setWinnerIds(winnerIds.filter(id => id !== p.id.toString()));
                            } else {
                              setWinnerIds([...winnerIds, p.id.toString()]);
                            }
                          } else {
                            setWinnerIds([p.id.toString()]);
                          }
                        }}
                        className={`p-3 rounded-lg text-center ${
                          winnerIds.includes(p.id.toString()) ? 'bg-red-500 text-white' : 'bg-gray-100'
                        }`}
                      >
                        <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                        <div className="font-bold text-sm">{p.name.slice(0, 2)}</div>
                        {multipleWinnersMode && winnerIds.includes(p.id.toString()) && (
                          <div className="text-xs mt-1">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {multipleWinnersMode && winnerIds.length > 1 && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ {winnerIds.length} 位贏家 - 出統者需付全部番數
                    </p>
                  )}
                </div>

                {/* Loser Selection */}
                {!isSelfDraw && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      {multipleWinnersMode ? '出統玩家 (付全部)' : '出統玩家'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {players.filter(p => !winnerIds.includes(p.id.toString())).map(p => (
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
                    {multipleWinnersMode && winnerIds.length > 1 && loserId && (
                      <p className="text-sm text-red-600 mt-2">
                        出統者將支付 {winnerIds.length * calculateFinalScore().final} 分
                      </p>
                    )}
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
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBaoZimo}
                        onChange={(e) => {
                          setIsBaoZimo(e.target.checked);
                          if (!e.target.checked) setBaoPayerId('');
                        }}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">包自摸 (出統者全付)</span>
                    </label>

                    {/* Bao Payer Selection */}
                    {isBaoZimo && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <label className="text-sm text-gray-600 block mb-2">
                          選擇包家 (必選) <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {players.filter(p => !winnerIds.includes(p.id.toString())).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setBaoPayerId(p.id.toString())}
                              className={`p-2 rounded-lg text-center text-sm btn-press ${
                                baoPayerId === p.id.toString()
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <div className="text-xs mb-1">{WINDS[p.seat_position - 1]}</div>
                              <div className="font-medium">{p.name.slice(0, 2)}</div>
                            </button>
                          ))}
                        </div>
                        {baoPayerId && (
                          <p className="text-sm text-amber-700 mt-2">
                            包家將支付全部 {getBaoSelfDrawTotal()} 分
                            <span className="text-xs text-gray-500 block">
                              ({players.length - 1}人 × {Math.round(getBaoSelfDrawTotal() / (players.length - 1))}分/人)
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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

                {/* Hand Details Toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHandDetails(!showHandDetails)}
                    className="flex items-center gap-2 text-sm text-blue-600 font-medium btn-press"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span>{showHandDetails ? '▼' : '▶'}</span>
                    <span>詳細牌型記錄 (可選)</span>
                  </button>

                  {showHandDetails && (
                    <div className="mt-3 space-y-3 p-3 bg-blue-50 rounded-lg">
                      {/* Predefined Hand Type */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">牌型</label>
                        <select
                          value={selectedHandType}
                          onChange={(e) => setSelectedHandType(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">選擇牌型...</option>
                          {categories.map(cat => (
                            <optgroup key={cat} label={getCategoryName(cat)}>
                              {handTypes
                                .filter(h => h.category === cat)
                                .map(h => (
                                  <option key={h.name} value={h.name}>
                                    {h.name} ({h.value}{config.scoringUnit})
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Custom Hand Name */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">自定義牌名</label>
                        <input
                          type="text"
                          value={customHandName}
                          onChange={(e) => setCustomHandName(e.target.value)}
                          placeholder="例如：三色同順、一氣通貫..."
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>

                      {/* Winning Tile */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">食糊牌</label>
                        <input
                          type="text"
                          value={winningTile}
                          onChange={(e) => setWinningTile(e.target.value)}
                          placeholder="例如：5萬、東風、白板..."
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>

                      {/* Is Dealer Win */}
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isDealerWin}
                          onChange={(e) => setIsDealerWin(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">莊家食糊</span>
                      </label>

                      {/* Hand Notes */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">備註</label>
                        <textarea
                          value={handNotes}
                          onChange={(e) => setHandNotes(e.target.value)}
                          placeholder="例如：Dora 3、海底撈月..."
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="備註 (可選)"
                  className="w-full px-3 py-2 border rounded-lg"
                />

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRecord(false)} 
                    className="flex-1 py-3 bg-gray-200 rounded-lg btn-press"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    disabled={winnerIds.length === 0 || (!isSelfDraw && !loserId) || (multipleWinnersMode && winnerIds.length < 2) || (isBaoZimo && !baoPayerId)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold disabled:bg-gray-400 btn-ripple"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    確認 {calculateFinalScore().final > 0 && `(${multipleWinnersMode ? winnerIds.length * calculateFinalScore().final : isBaoZimo ? getBaoSelfDrawTotal() : calculateFinalScore().final}分)`}
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
                <div key={round.id} className={`flex items-center justify-between p-2 rounded text-sm ${round.is_draw ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex-1">
                    <span className="text-gray-400 mr-2">#{rounds.length - idx}</span>
                    {round.is_draw ? (
                      <span className="text-blue-600 font-medium">🌊 流局</span>
                    ) : (
                      <>
                        {round.winners?.map((w, i) => (
                          <span key={w.id}>
                            <span className="text-red-600 font-medium">{w.name}</span>
                            {i < (round.winners?.length || 0) - 1 && <span className="text-gray-400">, </span>}
                          </span>
                        ))}
                        {!round.is_self_draw && round.loser_name && (
                          <span className="text-gray-500"> ← {round.loser_name}</span>
                        )}
                        {round.is_self_draw && <span className="text-amber-600 ml-1">(自摸)</span>}
                        {(round.winners?.length || 0) > 1 && <span className="text-purple-600 ml-1">(多贏)</span>}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-bold">{round.total_points}分</div>
                      {!round.is_draw && (
                        <div className="text-xs text-gray-400">{round.base_tai}{config.scoringUnit}</div>
                      )}
                    </div>
                    {game.status === 'active' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(round)}
                          className="text-blue-500 hover:text-blue-700 text-xs px-1"
                          title="編輯"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteRound(round.id)}
                          className="text-red-400 hover:text-red-600 text-xs px-1"
                          title="刪除"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
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
            
            {/* Titles Section */}
            {(() => {
              // Calculate titles
              const maxWins = Math.max(...players.map(p => p.wins));
              const maxSelfDraws = Math.max(...players.map(p => p.self_draws));
              const maxDealIns = Math.max(...players.map(p => p.deal_ins));
              const minWins = Math.min(...players.map(p => p.wins));
              
              const getTitles = (p: Player) => {
                const titles: { text: string; color: string; emoji: string }[] = [];
                if (p.wins > 0 && p.wins === maxWins) titles.push({ text: '食糊王', color: 'bg-red-100 text-red-700', emoji: '👑' });
                if (p.self_draws > 0 && p.self_draws === maxSelfDraws) titles.push({ text: '自摸王', color: 'bg-amber-100 text-amber-700', emoji: '🎯' });
                if (p.deal_ins > 0 && p.deal_ins === maxDealIns) titles.push({ text: '出銃王', color: 'bg-blue-100 text-blue-700', emoji: '💥' });
                if (p.wins === minWins && players.length > 1) titles.push({ text: '陪跑員', color: 'bg-gray-100 text-gray-600', emoji: '🏃' });
                return titles;
              };
              
              return (
                <div className="grid grid-cols-2 gap-3">
                  {players.map((p, i) => {
                    const titles = getTitles(p);
                    return (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{WINDS[i]}</span>
                          <span className="font-bold">{p.name}</span>
                          {p.is_dealer && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">莊</span>}
                        </div>
                        
                        {/* Titles */}
                        {titles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {titles.map((t, idx) => (
                              <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${t.color}`}>
                                {t.emoji} {t.text}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">食糊</span><span className="font-medium">{p.wins}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">自摸</span><span className="font-medium">{p.self_draws}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">出銃</span><span className="font-medium">{p.deal_ins}</span></div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-500">分數</span>
                            <span className={`font-bold ${p.final_score >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {p.final_score > 0 ? '+' : ''}{p.final_score}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            {/* Legend */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">稱號說明：</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">👑 食糊王 - 最多食糊</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">🎯 自摸王 - 最多自摸</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">💥 出銃王 - 最多出銃</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">🏃 陪跑員 - 最少食糊</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

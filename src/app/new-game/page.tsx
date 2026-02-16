'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  VARIANT_CONFIGS, 
  GameVariant 
} from '@/lib/mahjongRules';
import { 
  PRESET_RULES,
  getCustomRules,
  getAllRules,
  GameRule,
  calculateCustomScore
} from '@/lib/customRules';
import { FadeIn } from '@/components/AnimatedElements';

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

export default function NewGamePage() {
  const [step, setStep] = useState(1);
  const [variant, setVariant] = useState<GameVariant>('hongkong');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [rules, setRules] = useState<GameRule[]>([]);
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: '', color: COLORS[0] },
    { name: '', color: COLORS[1] },
    { name: '', color: COLORS[2] },
    { name: '', color: COLORS[3] },
  ]);
  const [existingPlayers, setExistingPlayers] = useState<any[]>([]);
  
  // Load rules
  useEffect(() => {
    setRules(getAllRules());
    setExistingPlayers([]);
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setExistingPlayers(data));
  }, []);

  // Get selected rule
  const selectedRule = rules.find(r => r.id === selectedRuleId);
  const config = VARIANT_CONFIGS[variant];

  useEffect(() => {
    if (!selectedRule) {
      // Auto-select first rule of variant
      const variantRules = rules.filter(r => {
        // Map rule characteristics to variant
        if (variant === 'hongkong' && !r.recordDealer && r.maxFan <= 13) {
          return true;
        }
        if (variant === 'taiwan' && r.recordDealer) {
          return true;
        }
        if (variant === 'japanese' && r.minFan >= 1) {
          return true;
        }
        return r.id.startsWith('preset-');
      });
      if (variantRules.length > 0 && !selectedRuleId) {
        setSelectedRuleId(variantRules[0].id);
      }
    }
    
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
    setGameName(`${dateStr} ${config.name} ${randomCode}`);
  }, [variant, rules, selectedRuleId]);

  function updatePlayer(index: number, field: 'name' | 'color', value: string) {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  }

  function validateStep1() {
    return selectedRuleId !== '';
  }

  function validateStep2() {
    const names = players.map(p => p.name.trim()).filter(n => n);
    return names.length === 4 && new Set(names).size === 4;
  }

  async function createGame() {
    try {
      // Create/get players
      const playerIds = [];
      for (const player of players) {
        const existing = existingPlayers.find((p: any) => p.name === player.name);
        if (existing) {
          playerIds.push(existing.id);
        } else {
          const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: player.name })
          });
          const newPlayer = await res.json();
          playerIds.push(newPlayer.id);
        }
      }

      const rule = selectedRule || PRESET_RULES[0];

      // Create game with rule settings
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          variant,
          playerIds,
          customSettings: {
            ruleId: rule.id,
            ruleName: rule.name,
            fullShoot: rule.fullShoot,
            jackpotEnabled: rule.jackpotEnabled,
            recordDealer: rule.recordDealer,
            passDealerOnDraw: rule.passDealerOnDraw,
            minFan: rule.minFan,
            maxFan: rule.maxFan,
            selfDrawMultiplier: rule.selfDrawMultiplier,
            fanPoints: rule.fanPoints,
            basePoints: rule.fanPoints[rule.minFan] || 1,
          },
        })
      });

      if (res.ok) {
        const game = await res.json();
        window.location.href = `/game/${game.id}`;
      }
    } catch (error) {
      alert('創建失敗: ' + error);
    }
  }

  // Filter rules by variant
  const getRulesForVariant = (v: GameVariant) => {
    return rules.filter(r => {
      // Simple heuristic to categorize rules
      if (v === 'taiwan') {
        return r.maxFan >= 10 || r.id.includes('taiwan') || r.name.includes('台');
      }
      if (v === 'japanese') {
        return r.minFan >= 1 || r.id.includes('japanese') || r.name.includes('日');
      }
      // Hong Kong or default
      return r.maxFan <= 13 || r.id.includes('hongkong') || r.id.startsWith('preset-');
    });
  };

  // Update colors to Teal theme
  const TEAL_COLORS = [
    'bg-teal-500', 'bg-violet-500', 'bg-orange-500', 'bg-cyan-500',
    'bg-emerald-500', 'bg-pink-500', 'bg-indigo-500', 'bg-amber-500'
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Header - Teal Design */}
      <header className="text-white p-4" style={{ 
        background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg hover:opacity-80 transition-opacity">←</Link>
          <h1 className="text-xl font-bold">新增對局</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'text-white' : 'bg-slate-200 text-slate-500'
            }`}
            style={{ backgroundColor: step >= s ? '#0D9488' : undefined }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Select Variant & Rule */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">選擇規則</h2>
            
            {/* Variant Selection */}
            <div className="grid grid-cols-3 gap-2">
              {Object.values(VARIANT_CONFIGS).map((v, i) => (
                <FadeIn key={v.id} delay={i * 50}>
                  <button
                    onClick={() => {
                      setVariant(v.id);
                      setSelectedRuleId('');
                    }}
                    className={`w-full p-3 rounded-xl text-center border-2 transition-all hover:shadow-md ${
                      variant === v.id ? 'bg-teal-50' : 'border-slate-200 bg-white'
                    }`}
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      borderColor: variant === v.id ? '#0D9488' : undefined
                    }}
                  >
                    <div className="font-bold text-sm" style={{ color: variant === v.id ? '#0D9488' : '#1E293B' }}>{v.name}</div>
                  </button>
                </FadeIn>
              ))}
            </div>

            {/* Rule Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">選擇計分規則</label>
                <Link href="/rules" className="text-xs text-blue-600">
                  管理規則 →
                </Link>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getRulesForVariant(variant).map((rule, i) => (
                  <FadeIn key={rule.id} delay={i * 30}>
                    <button
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`w-full p-3 rounded-xl text-left border-2 transition-all hover:shadow-md ${
                        selectedRuleId === rule.id ? 'bg-teal-50' : 'border-slate-200 bg-white'
                      }`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        borderColor: selectedRuleId === rule.id ? '#0D9488' : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold" style={{ color: selectedRuleId === rule.id ? '#0D9488' : '#1E293B' }}>{rule.name}</div>
                          <div className="text-xs text-slate-500">
                            {rule.fullShoot ? '全銃' : '半銃'} · {rule.minFan}-{rule.maxFan}番
                            {rule.jackpotEnabled && ' · Jackpot'}
                          </div>
                        </div>
                        {rule.isPreset ? (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            預設
                          </span>
                        ) : (
                          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                            自訂
                          </span>
                        )}
                      </div>
                      {/* Preview points */}
                      <div className="mt-2 text-xs text-slate-400">
                        {rule.minFan}番={rule.fanPoints[rule.minFan]}分 | 
                        {Math.floor((rule.minFan + rule.maxFan) / 2)}番=
                        {rule.fanPoints[Math.floor((rule.minFan + rule.maxFan) / 2)] || '?'}分 | 
                        自摸{rule.selfDrawMultiplier}x
                      </div>
                    </button>
                  </FadeIn>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="w-full text-white py-3 rounded-xl font-bold disabled:bg-slate-300 transition-all hover:transform hover:-translate-y-0.5"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                background: validateStep1() ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' : undefined,
                boxShadow: validateStep1() ? '0 4px 14px rgba(13, 148, 136, 0.39)' : 'none'
              }}
            >
              下一步
            </button>
          </div>
        )}

        {/* Step 2: Game Name & Players */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">對局名稱</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">4位玩家</label>
              <div className="space-y-2">
                {players.map((player, i) => (
                  <FadeIn key={i} delay={i * 50}>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg card-press">
                      <div className={`w-8 h-8 rounded-full ${player.color}`}></div>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                        placeholder={`玩家 ${i + 1}`}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                    </div>
                  </FadeIn>
                ))}
              </div>
              
              {existingPlayers.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">快速選擇:</p>
                  <div className="flex flex-wrap gap-2">
                    {existingPlayers.slice(0, 8).map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const emptyIndex = players.findIndex(pl => !pl.name);
                          if (emptyIndex !== -1) updatePlayer(emptyIndex, 'name', p.name);
                        }}
                        className="px-3 py-1 bg-white rounded-full text-sm border btn-press"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 bg-gray-200 py-3 rounded-lg btn-press"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!validateStep2()}
                className="flex-1 text-white py-3 rounded-xl font-bold disabled:bg-slate-300 transition-all hover:transform hover:-translate-y-0.5"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  background: validateStep2() ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' : undefined,
                  boxShadow: validateStep2() ? '0 4px 14px rgba(13, 148, 136, 0.39)' : 'none'
                }}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && selectedRule && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">對局摘要</h2>
            
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <div>
                <span className="text-gray-500">規則:</span>
                <span className="font-bold ml-2">{selectedRule.name}</span>
                {selectedRule.isPreset ? (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">預設</span>
                ) : (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">自訂</span>
                )}
              </div>
              
              <div>
                <span className="text-gray-500">名稱:</span>
                <span className="ml-2">{gameName}</span>
              </div>
              
              <div>
                <span className="text-gray-500">玩家:</span>
                <span className="ml-2">{players.map(p => p.name).join(', ')}</span>
              </div>
              
              <div className="pt-3 border-t">
                <h3 className="font-medium mb-2">規則詳情</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• {selectedRule.fullShoot ? '全銃' : '半銃'}</div>
                  <div>• 番數範圍: {selectedRule.minFan}-{selectedRule.maxFan}番</div>
                  <div>• 自摸倍數: {selectedRule.selfDrawMultiplier}x</div>
                  {selectedRule.jackpotEnabled && <div>• 啟用 Jackpot</div>}
                  {selectedRule.recordDealer && <div>• 記錄莊家</div>}
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <h3 className="font-medium mb-2">番數預覽</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">{selectedRule.minFan}番:</span>
                    <span className="font-bold ml-1">{selectedRule.fanPoints[selectedRule.minFan]}分</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">{selectedRule.maxFan}番:</span>
                    <span className="font-bold ml-1">{selectedRule.fanPoints[selectedRule.maxFan]}分</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setStep(2)} 
                className="flex-1 py-3 rounded-xl font-medium transition-all hover:bg-slate-200"
                style={{ WebkitTapHighlightColor: 'transparent', backgroundColor: '#F1F5F9', color: '#64748B' }}
              >
                上一步
              </button>
              <button 
                onClick={createGame} 
                className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:transform hover:-translate-y-0.5"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.39)'
                }}
              >
                開始對局
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VARIANT_CONFIGS, HAND_TYPES_BY_VARIANT, GameVariant } from '@/lib/mahjongRules';

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

export default function NewGamePage() {
  const [step, setStep] = useState(1);
  const [variant, setVariant] = useState<GameVariant>('hongkong');
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: '', color: COLORS[0] },
    { name: '', color: COLORS[1] },
    { name: '', color: COLORS[2] },
    { name: '', color: COLORS[3] },
  ]);
  const [existingPlayers, setExistingPlayers] = useState<any[]>([]);
  
  // Custom settings
  const [customSettings, setCustomSettings] = useState({
    basePoints: 1,
    selfDrawMultiplier: 2,
    dealerBonus: 0,
    dealerRepeatBonus: 0,
    useFu: false,
    enableRiichi: false,
    enableHonba: false,
  });

  const config = VARIANT_CONFIGS[variant];

  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
    setGameName(`${dateStr} ${config.name} ${randomCode}`);
    
    // Update default settings based on variant
    setCustomSettings({
      basePoints: config.basePoints,
      selfDrawMultiplier: config.selfDrawMultiplier,
      dealerBonus: config.dealerBonus,
      dealerRepeatBonus: config.dealerRepeatBonus,
      useFu: config.useFu,
      enableRiichi: config.hasRiichi,
      enableHonba: config.hasHonba,
    });
    
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setExistingPlayers(data));
  }, [variant]);

  function updatePlayer(index: number, field: 'name' | 'color', value: string) {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  }

  function validateStep1() {
    return true; // variant is always set
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

      // Create game with variant-specific settings
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          variant,
          playerIds,
          customSettings: {
            basePoints: customSettings.basePoints,
            selfDrawMultiplier: customSettings.selfDrawMultiplier,
            dealerBonus: customSettings.dealerBonus,
            dealerRepeatBonus: customSettings.dealerRepeatBonus,
            useFu: customSettings.useFu,
            hasRiichi: customSettings.enableRiichi,
            hasHonba: customSettings.enableHonba,
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

  const variantOptions = Object.values(VARIANT_CONFIGS);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">新增對局</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Select Variant */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">選擇規則</h2>
            <div className="space-y-2">
              {variantOptions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v.id)}
                  className={`w-full p-4 rounded-lg text-left border-2 transition ${
                    variant === v.id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-bold">{v.name}</div>
                  <div className="text-sm text-gray-500">{v.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    底分: {v.basePoints} · {v.scoringUnit}制
                    {v.hasRiichi && ' · 立直'}
                    {v.hasFlowers && ' · 花牌'}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold"
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
                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg">
                    <div className={`w-8 h-8 rounded-full ${player.color}`}></div>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                      placeholder={`玩家 ${i + 1}`}
                      className="flex-1 px-2 py-1 border rounded"
                    />
                  </div>
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
                        className="px-3 py-1 bg-white rounded-full text-sm border"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 py-3 rounded-lg">
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!validateStep2()}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">規則設定</h2>
            
            <div className="bg-white rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  底分 (每{config.scoringUnit})
                </label>
                <input
                  type="number"
                  value={customSettings.basePoints}
                  onChange={(e) => setCustomSettings({...customSettings, basePoints: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">自摸倍數</label>
                <input
                  type="number"
                  value={customSettings.selfDrawMultiplier}
                  onChange={(e) => setCustomSettings({...customSettings, selfDrawMultiplier: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {variant === 'taiwan' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">莊家加成 (台)</label>
                    <input
                      type="number"
                      value={customSettings.dealerBonus}
                      onChange={(e) => setCustomSettings({...customSettings, dealerBonus: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">連莊加成 (每台)</label>
                    <input
                      type="number"
                      value={customSettings.dealerRepeatBonus}
                      onChange={(e) => setCustomSettings({...customSettings, dealerRepeatBonus: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {variant === 'japanese' && (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">使用符計算</span>
                    <input
                      type="checkbox"
                      checked={customSettings.useFu}
                      onChange={(e) => setCustomSettings({...customSettings, useFu: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">啟用立直</span>
                    <input
                      type="checkbox"
                      checked={customSettings.enableRiichi}
                      onChange={(e) => setCustomSettings({...customSettings, enableRiichi: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">啟用積棒子</span>
                    <input
                      type="checkbox"
                      checked={customSettings.enableHonba}
                      onChange={(e) => setCustomSettings({...customSettings, enableHonba: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-2">對局摘要</h3>
              <p className="text-sm text-yellow-700">規則: {config.name}</p>
              <p className="text-sm text-yellow-700">名稱: {gameName}</p>
              <p className="text-sm text-yellow-700">玩家: {players.map(p => p.name).join(', ')}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 py-3 rounded-lg">
                上一步
              </button>
              <button onClick={createGame} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold">
                開始對局
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

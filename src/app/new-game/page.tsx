'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player } from '@/types';

const VARIANTS = [
  { id: 'hongkong', name: '香港麻雀', desc: '13張 · 全銃/半銃' },
  { id: 'taiwan', name: '台灣麻將', desc: '16張 · 連莊拉莊' },
  { id: 'japanese', name: '日本麻雀', desc: '立直 · 符點制' },
  { id: 'custom', name: '自訂規則', desc: '自定義設定' },
];

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

export default function NewGamePage() {
  const [step, setStep] = useState(1);
  const [variant, setVariant] = useState('hongkong');
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: '', color: COLORS[0] },
    { name: '', color: COLORS[1] },
    { name: '', color: COLORS[2] },
    { name: '', color: COLORS[3] },
  ]);
  const [settings, setSettings] = useState({
    baseScore: 1,
    selfDrawMultiplier: 2,
    fullLiability: true,
    enableKongBonus: true,
    enableDealerRepeat: true,
  });
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Generate default game name
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
    setGameName(`${dateStr} 麻雀局 ${randomCode}`);
    
    // Fetch existing players
    fetch('/api/players')
      .then(res => res.json())
      .then(data => setExistingPlayers(data));
  }, []);

  function updatePlayer(index: number, field: 'name' | 'color', value: string) {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  }

  function selectExistingPlayer(index: number, playerName: string) {
    updatePlayer(index, 'name', playerName);
  }

  function validateStep1() {
    return variant !== '';
  }

  function validateStep2() {
    const names = players.map(p => p.name.trim()).filter(n => n);
    return names.length === 4 && new Set(names).size === 4;
  }

  async function createGame() {
    try {
      // First create/get players
      const playerIds = [];
      for (const player of players) {
        const existing = existingPlayers.find(p => p.name === player.name);
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

      // Create game
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          variant,
          playerIds,
          customSettings: settings,
        })
      });

      if (res.ok) {
        const game = await res.json();
        window.location.href = `/game/${game.id}`;
      } else {
        const error = await res.json();
        alert('創建失敗: ' + (error.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('創建失敗: ' + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">新增對局</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto p-4">
        {/* Step 1: Select Variant */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">選擇遊戲規則</h2>
            <div className="space-y-2">
              {VARIANTS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v.id)}
                  className={`w-full p-4 rounded-lg text-left border-2 transition ${
                    variant === v.id 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-bold">{v.name}</div>
                  <div className="text-sm text-gray-500">{v.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
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
                placeholder="輸入對局名稱"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">4位玩家</label>
              <div className="space-y-2">
                {players.map((player, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg">
                    <div className={`w-8 h-8 rounded-full ${player.color}`}></div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                        placeholder={`玩家 ${i + 1}`}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <select
                      value={player.color}
                      onChange={(e) => updatePlayer(i, 'color', e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {COLORS.map(c => (
                        <option key={c} value={c}>{c.replace('bg-', '').replace('-500', '')}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Quick select existing players */}
              {existingPlayers.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">快速選擇現有玩家：</p>
                  <div className="flex flex-wrap gap-2">
                    {existingPlayers.slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const emptyIndex = players.findIndex(pl => !pl.name);
                          if (emptyIndex !== -1) {
                            selectExistingPlayer(emptyIndex, p.name);
                          }
                        }}
                        className="px-3 py-1 bg-white rounded-full text-sm border hover:bg-blue-100"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg"
              >
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

        {/* Step 3: Settings & Create */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">規則設定</h2>
            
            <div className="bg-white rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">底分</label>
                <input
                  type="number"
                  value={settings.baseScore}
                  onChange={(e) => setSettings({...settings, baseScore: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自摸倍數</label>
                <select
                  value={settings.selfDrawMultiplier}
                  onChange={(e) => setSettings({...settings, selfDrawMultiplier: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={2}>2倍</option>
                  <option value={3}>3倍</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">全銃制（閒家全付）</span>
                <input
                  type="checkbox"
                  checked={settings.fullLiability}
                  onChange={(e) => setSettings({...settings, fullLiability: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">啟用槓牌加成</span>
                <input
                  type="checkbox"
                  checked={settings.enableKongBonus}
                  onChange={(e) => setSettings({...settings, enableKongBonus: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">啟用連莊加倍</span>
                <input
                  type="checkbox"
                  checked={settings.enableDealerRepeat}
                  onChange={(e) => setSettings({...settings, enableDealerRepeat: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-2">對局摘要</h3>
              <p className="text-sm text-yellow-700">名稱：{gameName}</p>
              <p className="text-sm text-yellow-700">規則：{VARIANTS.find(v => v.id === variant)?.name}</p>
              <p className="text-sm text-yellow-700">玩家：{players.map(p => p.name).join(', ')}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg"
              >
                上一步
              </button>
              <button
                onClick={createGame}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold"
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

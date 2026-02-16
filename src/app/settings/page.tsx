'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Default HK hand types with fan values
const DEFAULT_HAND_TYPES = [
  { name: '雞胡', fan: 0, category: 'basic' },
  { name: '無花', fan: 1, category: 'flower' },
  { name: '正花', fan: 1, category: 'flower' },
  { name: '花胡', fan: 3, category: 'flower' },
  { name: '自摸', fan: 1, category: 'win' },
  { name: '門前清', fan: 1, category: 'basic' },
  { name: '槓上開花', fan: 3, category: 'kong' },
  { name: '搶槓', fan: 3, category: 'kong' },
  { name: '槓上槓', fan: 8, category: 'kong' },
  { name: '海底撈月', fan: 3, category: 'special' },
  { name: '河底撈魚', fan: 3, category: 'special' },
  { name: '碰碰胡', fan: 3, category: 'combination' },
  { name: '三暗刻', fan: 3, category: 'combination' },
  { name: '四暗刻', fan: 13, category: 'combination' },
  { name: '七對', fan: 4, category: 'combination' },
  { name: '十八羅漢', fan: 13, category: 'combination' },
  { name: '混一色', fan: 3, category: 'suit' },
  { name: '清一色', fan: 7, category: 'suit' },
  { name: '混么九', fan: 7, category: 'terminal' },
  { name: '清么九', fan: 7, category: 'terminal' },
  { name: '小三元', fan: 5, category: 'honor' },
  { name: '大三元', fan: 8, category: 'honor' },
  { name: '小四喜', fan: 10, category: 'honor' },
  { name: '大四喜', fan: 13, category: 'honor' },
  { name: '字一色', fan: 13, category: 'honor' },
  { name: '十三么', fan: 13, category: 'special' },
  { name: '天胡', fan: 13, category: 'limit' },
  { name: '地胡', fan: 13, category: 'limit' },
  { name: '人胡', fan: 13, category: 'limit' },
];

const categories: { [key: string]: string } = {
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
};

export default function SettingsPage() {
  const [handTypes, setHandTypes] = useState(DEFAULT_HAND_TYPES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('hkHandTypes');
    if (saved) {
      try {
        setHandTypes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved hand types');
      }
    }
  }, []);

  function updateFan(name: string, fan: number) {
    setHandTypes(prev => 
      prev.map(h => h.name === name ? { ...h, fan } : h)
    );
    setSaved(false);
  }

  function saveSettings() {
    localStorage.setItem('hkHandTypes', JSON.stringify(handTypes));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetToDefault() {
    if (confirm('確定要重設為默認番數嗎？')) {
      setHandTypes(DEFAULT_HAND_TYPES);
      localStorage.removeItem('hkHandTypes');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  // Group by category
  const grouped = handTypes.reduce((acc, hand) => {
    if (!acc[hand.category]) acc[hand.category] = [];
    acc[hand.category].push(hand);
    return acc;
  }, {} as { [key: string]: typeof handTypes });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">⚙️ 番種設定</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>自定義每個番種的番數。修改後會保存在本機，新開牌局會使用這些設定。</p>
        </div>

        {/* Hand Types by Category */}
        {Object.entries(grouped).map(([category, hands]) => (
          <div key={category} className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-gray-800 mb-3">{categories[category] || category}</h2>
            <div className="space-y-2">
              {hands.map(hand => (
                <div key={hand.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{hand.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={hand.fan}
                      onChange={(e) => updateFan(hand.name, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border rounded text-center"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-gray-500">番</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold"
          >
            {saved ? '✓ 已保存' : '保存設定'}
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            重設
          </button>
        </div>

        {/* Back */}
        <Link 
          href="/"
          className="block text-center py-3 text-gray-600"
        >
          ← 返回主頁
        </Link>
      </main>
    </div>
  );
}

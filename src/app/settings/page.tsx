'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { themes, Theme } from '@/lib/themes';

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
  const { theme, setTheme, themeConfig } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [handTypes, setHandTypes] = useState(DEFAULT_HAND_TYPES);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'hands'>('appearance');

  useEffect(() => {
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

  const grouped = handTypes.reduce((acc, hand) => {
    if (!acc[hand.category]) acc[hand.category] = [];
    acc[hand.category].push(hand);
    return acc;
  }, {} as { [key: string]: typeof handTypes });

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="app-header p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">⚙️ {t('settings')}</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'appearance'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            🎨 {t('appearance')}
          </button>
          <button
            onClick={() => setActiveTab('hands')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'hands'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            🀄 {t('handTypes')}
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 space-y-4">
        {activeTab === 'appearance' ? (
          <>
            {/* Theme Selection */}
            <div className="app-card p-5">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                🎨 {t('theme')}
              </h2>
              <div className="space-y-3">
                {(Object.keys(themes) as Theme[]).map((themeKey) => {
                  const config = themes[themeKey];
                  return (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        theme === themeKey
                          ? 'border-current'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: config.colors.surface,
                        borderColor: theme === themeKey ? config.colors.primary : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                          style={{
                            backgroundColor: config.colors.primary,
                            color: 'white',
                          }}
                        >
                          {themeKey === 'default' && '🇭🇰'}
                          {themeKey === 'ocean' && '🌊'}
                          {themeKey === 'elite' && '👑'}
                        </div>
                        <div className="flex-1">
                          <div
                            className="font-bold"
                            style={{ color: config.colors.text }}
                          >
                            {config.name}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: config.colors.textMuted }}
                          >
                            {config.description}
                          </div>
                        </div>
                        {theme === themeKey && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: config.colors.primary,
                              color: 'white',
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selection */}
            <div className="app-card p-5">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                🌐 {t('language')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLang('zh')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    lang === 'zh'
                      ? 'border-current'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: lang === 'zh' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: lang === 'zh' ? 'white' : 'var(--color-text)',
                    borderColor: lang === 'zh' ? 'var(--color-primary)' : undefined,
                  }}
                >
                  <div className="text-2xl mb-1">🇭🇰</div>
                  <div className="font-bold">繁體中文</div>
                  <div className="text-xs opacity-70">Chinese</div>
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    lang === 'en'
                      ? 'border-current'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: lang === 'en' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: lang === 'en' ? 'white' : 'var(--color-text)',
                    borderColor: lang === 'en' ? 'var(--color-primary)' : undefined,
                  }}
                >
                  <div className="text-2xl mb-1">🇬🇧</div>
                  <div className="font-bold">English</div>
                  <div className="text-xs opacity-70">英文</div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Hand Types */}
            <div className="app-card p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="text-sm mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)' }}>
                自定義每個番種的番數。修改後會保存在本機，新開牌局會使用這些設定。
              </div>

              {Object.entries(grouped).map(([category, hands]) => (
                <div key={category} className="mb-4">
                  <h2 className="font-bold mb-3 px-2" style={{ color: 'var(--color-text)' }}>
                    {categories[category] || category}
                  </h2>
                  <div className="space-y-2">
                    {hands.map(hand => (
                      <div
                        key={hand.name}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--color-secondary)' }}
                      >
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {hand.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={hand.fan}
                            onChange={(e) => updateFan(hand.name, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded text-center app-input"
                            min={0}
                            max={100}
                          />
                          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>番</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveSettings}
                  className="flex-1 btn-primary py-3"
                >
                  {saved ? '✓ ' + t('saved') : t('save')}
                </button>
                <button
                  onClick={resetToDefault}
                  className="px-6 btn-secondary py-3"
                >
                  {t('reset')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Back */}
        <Link 
          href="/"
          className="block text-center py-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← {t('back')}
        </Link>
      </main>
    </div>
  );
}

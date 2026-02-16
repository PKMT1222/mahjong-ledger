'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PRESET_RULES, 
  getCustomRules, 
  saveCustomRules,
  deleteCustomRule,
  duplicatePresetRule,
  GameRule,
  calculateSelfDrawPoints,
  generateDefaultFanPoints
} from '@/lib/customRules';

export default function RulesPage() {
  const [rules, setRules] = useState<GameRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<GameRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<GameRule>>({
    name: '',
    fullShoot: true,
    jackpotEnabled: true,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 3,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {}
  });

  useEffect(() => {
    loadRules();
  }, []);

  function loadRules() {
    const custom = getCustomRules();
    setRules([...PRESET_RULES, ...custom]);
  }

  function handleDelete(rule: GameRule) {
    if (rule.isPreset) {
      alert('預設規則不能刪除');
      return;
    }
    
    if (confirm(`確定要刪除規則 "${rule.name}" 嗎？`)) {
      deleteCustomRule(rule.id);
      loadRules();
    }
  }

  function handleDuplicate(rule: GameRule) {
    const newName = prompt('新規則名稱:', `${rule.name} (複製)`);
    if (newName) {
      if (rule.isPreset) {
        duplicatePresetRule(rule.id, newName);
      } else {
        // Duplicate custom rule
        const custom = getCustomRules();
        const newRule: GameRule = {
          ...rule,
          id: `custom-${Date.now()}`,
          name: newName,
          isPreset: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveCustomRules([...custom, newRule]);
      }
      loadRules();
    }
  }

  function handleEdit(rule: GameRule) {
    if (rule.isPreset) {
      alert('預設規則不能編輯，請使用「複製」創建副本');
      return;
    }
    
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowForm(true);
  }

  function handleNew() {
    setEditingRule(null);
    const defaultPoints = generateDefaultFanPoints(3, 10, 4);
    setFormData({
      name: '',
      fullShoot: true,
      jackpotEnabled: true,
      recordDealer: true,
      passDealerOnDraw: false,
      minFan: 3,
      maxFan: 10,
      selfDrawMultiplier: 1,
      fanPoints: defaultPoints
    });
    setShowForm(true);
  }

  function updateFanPointsRange() {
    const { minFan = 3, maxFan = 10 } = formData;
    const newPoints: { [fan: number]: number } = {};
    
    for (let fan = minFan; fan <= maxFan; fan++) {
      // Keep existing value if present, otherwise generate default
      newPoints[fan] = formData.fanPoints?.[fan] || Math.pow(2, fan - 1);
    }
    
    setFormData({ ...formData, fanPoints: newPoints });
  }

  function updateFanPoint(fan: number, points: number) {
    setFormData({
      ...formData,
      fanPoints: {
        ...formData.fanPoints,
        [fan]: points
      }
    });
  }

  function handleSave() {
    if (!formData.name?.trim()) {
      alert('請輸入規則名稱');
      return;
    }
    
    const ruleData: GameRule = {
      id: editingRule?.id || `custom-${Date.now()}`,
      name: formData.name,
      isPreset: false,
      fullShoot: formData.fullShoot ?? true,
      jackpotEnabled: formData.jackpotEnabled ?? true,
      recordDealer: formData.recordDealer ?? true,
      passDealerOnDraw: formData.passDealerOnDraw ?? false,
      minFan: formData.minFan ?? 3,
      maxFan: formData.maxFan ?? 10,
      selfDrawMultiplier: formData.selfDrawMultiplier ?? 1,
      fanPoints: formData.fanPoints || {},
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const custom = getCustomRules();
    
    if (editingRule) {
      // Update existing
      const index = custom.findIndex(r => r.id === editingRule.id);
      if (index !== -1) {
        custom[index] = ruleData;
        saveCustomRules(custom);
      }
    } else {
      // Check for duplicate name
      if (custom.some(r => r.name === ruleData.name) || 
          PRESET_RULES.some(r => r.name === ruleData.name)) {
        alert('規則名稱已存在');
        return;
      }
      saveCustomRules([...custom, ruleData]);
    }
    
    loadRules();
    setShowForm(false);
    setEditingRule(null);
  }

  // Generate fan points table rows
  const fanRows = [];
  const minFan = formData.minFan || 3;
  const maxFan = formData.maxFan || 10;
  
  for (let fan = minFan; fan <= maxFan; fan++) {
    const winPoints = formData.fanPoints?.[fan] || 0;
    const selfDrawPoints = calculateSelfDrawPoints(winPoints, formData.selfDrawMultiplier || 1);
    
    fanRows.push(
      <tr key={fan} className="border-b">
        <td className="py-2 px-3 text-center font-medium">{fan}番</td>
        <td className="py-2 px-3">
          <input
            type="number"
            value={winPoints}
            onChange={(e) => updateFanPoint(fan, parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border rounded text-center"
            min={1}
          />
        </td>
        <td className="py-2 px-3 text-center text-gray-600">
          {selfDrawPoints}
        </td>
      </tr>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-red-700 text-white p-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => setShowForm(false)} className="text-white text-lg">←</button>
            <h1 className="text-xl font-bold">
              {editingRule ? '編輯規則' : '新增規則'}
            </h1>
            <div className="w-6"></div>
          </div>
        </header>

        <main className="max-w-lg mx-auto p-4 space-y-4">
          {/* Rule Name */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">規則名稱</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="例如：3番4半辣上"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="font-bold text-gray-800">一般設定</h2>
            
            {/* Full/Half Shoot */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">計分方式</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, fullShoot: true})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    formData.fullShoot ? 'bg-red-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  全銃 (閒家全付)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, fullShoot: false})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    !formData.fullShoot ? 'bg-red-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  半銃 (閒家付半)
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">啟用 Jackpot (一檔/二檔)</span>
                <input
                  type="checkbox"
                  checked={formData.jackpotEnabled}
                  onChange={(e) => setFormData({...formData, jackpotEnabled: e.target.checked})}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">記錄莊家同風圈</span>
                <input
                  type="checkbox"
                  checked={formData.recordDealer}
                  onChange={(e) => setFormData({...formData, recordDealer: e.target.checked})}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">荒牌時莊家過莊</span>
                <input
                  type="checkbox"
                  checked={formData.passDealerOnDraw}
                  onChange={(e) => setFormData({...formData, passDealerOnDraw: e.target.checked})}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          {/* Fan Settings */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="font-bold text-gray-800">番數設定</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">最小番數</label>
                <input
                  type="number"
                  value={formData.minFan}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setFormData({...formData, minFan: val});
                    setTimeout(updateFanPointsRange, 0);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                  max={formData.maxFan}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">最大番數 (滿糊)</label>
                <input
                  type="number"
                  value={formData.maxFan}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    setFormData({...formData, maxFan: val});
                    setTimeout(updateFanPointsRange, 0);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={formData.minFan}
                  max={20}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">自摸倍數</label>
              <input
                type="number"
                step="0.5"
                value={formData.selfDrawMultiplier}
                onChange={(e) => setFormData({...formData, selfDrawMultiplier: parseFloat(e.target.value) || 1})}
                className="w-full px-3 py-2 border rounded-lg"
                min={0.5}
                max={5}
              />
              <p className="text-xs text-gray-400 mt-1">自摸番數 = 出統番數 × 倍數</p>
            </div>

            {/* Fan Points Table */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">番數對照表</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-center">番數</th>
                      <th className="py-2 px-3 text-center">出統番數</th>
                      <th className="py-2 px-3 text-center">自摸番數</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fanRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 bg-gray-200 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold"
            >
              保存
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">⚙️ 規則設定</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Add Button */}
        <button
          onClick={handleNew}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold mb-4 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>新增規則</span>
        </button>

        {/* Rules List */}
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{rule.name}</h3>
                    {rule.isPreset && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        預設
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {rule.fullShoot ? '全銃' : '半銃'} · 
                    {rule.minFan}-{rule.maxFan}番 · 
                    {rule.jackpotEnabled ? '有Jackpot' : '無Jackpot'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    自摸倍數: {rule.selfDrawMultiplier}x
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDuplicate(rule)}
                    className="text-sm text-blue-600 px-2 py-1"
                  >
                    複製
                  </button>
                  {!rule.isPreset && (
                    <>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-sm text-gray-600 px-2 py-1"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(rule)}
                        className="text-sm text-red-500 px-2 py-1"
                      >
                        刪除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

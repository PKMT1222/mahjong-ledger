// Game Rules Configuration System

export interface GameRule {
  id: string;
  name: string;
  isPreset: boolean;
  // General settings
  fullShoot: boolean; // true = 全銃, false = 半銃
  jackpotEnabled: boolean;
  recordDealer: boolean;
  passDealerOnDraw: boolean;
  // Fan settings
  minFan: number;
  maxFan: number;
  selfDrawMultiplier: number;
  // Points table: fan -> win points
  fanPoints: { [fan: number]: number };
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// Default preset rules based on common Hong Kong variations
export const PRESET_RULES: GameRule[] = [
  {
    id: 'preset-3fan-4-half',
    name: '3番4半辣上',
    isPreset: true,
    fullShoot: false, // 半銃
    jackpotEnabled: true,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 3,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {
      3: 4, 4: 8, 5: 12, 6: 16, 7: 24, 8: 32, 9: 40, 10: 48
    }
  },
  {
    id: 'preset-3fan-4-full',
    name: '3番4辣辣上',
    isPreset: true,
    fullShoot: true, // 全銃
    jackpotEnabled: true,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 3,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {
      3: 4, 4: 8, 5: 12, 6: 16, 7: 24, 8: 32, 9: 40, 10: 48
    }
  },
  {
    id: 'preset-2fan-5-half',
    name: '二五雞半辣上',
    isPreset: true,
    fullShoot: false,
    jackpotEnabled: true,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 2,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {
      2: 2, 3: 5, 4: 10, 5: 15, 6: 20, 7: 30, 8: 40, 9: 50, 10: 60
    }
  },
  {
    id: 'preset-2fan-5-full',
    name: '二五雞辣辣上',
    isPreset: true,
    fullShoot: true,
    jackpotEnabled: true,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 2,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {
      2: 2, 3: 5, 4: 10, 5: 15, 6: 20, 7: 30, 8: 40, 9: 50, 10: 60
    }
  },
  {
    id: 'preset-1fan-1-half',
    name: '一番一雞半辣上',
    isPreset: true,
    fullShoot: false,
    jackpotEnabled: false,
    recordDealer: true,
    passDealerOnDraw: true,
    minFan: 1,
    maxFan: 10,
    selfDrawMultiplier: 1,
    fanPoints: {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10
    }
  },
  {
    id: 'preset-classic',
    name: '傳統港式',
    isPreset: true,
    fullShoot: true,
    jackpotEnabled: false,
    recordDealer: true,
    passDealerOnDraw: false,
    minFan: 1,
    maxFan: 13,
    selfDrawMultiplier: 2, // Self-draw pays double
    fanPoints: {
      1: 2, 2: 4, 3: 8, 4: 12, 5: 16, 6: 24, 7: 32, 8: 48, 9: 64, 10: 96, 11: 128, 12: 192, 13: 256
    }
  },
];

// Default values for new custom rules
export const DEFAULT_CUSTOM_RULE: Omit<GameRule, 'id' | 'isPreset'> = {
  name: '新規則',
  fullShoot: true,
  jackpotEnabled: true,
  recordDealer: true,
  passDealerOnDraw: false,
  minFan: 3,
  maxFan: 10,
  selfDrawMultiplier: 1,
  fanPoints: {
    3: 4, 4: 8, 5: 12, 6: 16, 7: 24, 8: 32, 9: 40, 10: 48
  }
};

// Generate default fan points based on min/max fan
export function generateDefaultFanPoints(minFan: number, maxFan: number, basePoints: number = 4): { [fan: number]: number } {
  const points: { [fan: number]: number } = {};
  let currentPoints = basePoints;
  
  for (let fan = minFan; fan <= maxFan; fan++) {
    points[fan] = currentPoints;
    // Increase by roughly 1.5x each level, rounding to nearest integer
    if (fan < maxFan) {
      currentPoints = Math.round(currentPoints * 1.5);
    }
  }
  
  return points;
}

// Calculate self-draw points
export function calculateSelfDrawPoints(winPoints: number, multiplier: number): number {
  return Math.round(winPoints * multiplier);
}

// Validate rule
export function validateRule(rule: GameRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!rule.name || rule.name.trim() === '') {
    errors.push('規則名稱不能為空');
  }
  
  if (rule.minFan < 1) {
    errors.push('最小番數必須至少為1');
  }
  
  if (rule.maxFan < rule.minFan) {
    errors.push('最大番數必須大於或等於最小番數');
  }
  
  if (rule.selfDrawMultiplier < 0.5) {
    errors.push('自摸倍數必須至少為0.5');
  }
  
  // Check all fan points are positive
  for (let fan = rule.minFan; fan <= rule.maxFan; fan++) {
    const points = rule.fanPoints[fan];
    if (points === undefined || points === null) {
      errors.push(`缺少${fan}番的番數設定`);
    } else if (points < 1) {
      errors.push(`${fan}番的番數必須至少為1`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Calculate score using custom rule
export function calculateCustomScore(
  rule: GameRule,
  fan: number,
  isSelfDraw: boolean,
  isDealer: boolean
): { winnerPoints: number; loserPoints: number; breakdown: string } {
  // Get base points from table, or interpolate if needed
  let basePoints = rule.fanPoints[fan];
  
  if (basePoints === undefined) {
    // If fan is outside range, use the nearest
    if (fan < rule.minFan) {
      basePoints = rule.fanPoints[rule.minFan];
    } else if (fan > rule.maxFan) {
      basePoints = rule.fanPoints[rule.maxFan];
    }
  }
  
  // Calculate winner points
  let winnerPoints = basePoints;
  let breakdown = `${fan}番 = ${basePoints}分`;
  
  // Self-draw multiplier
  if (isSelfDraw) {
    winnerPoints = calculateSelfDrawPoints(basePoints, rule.selfDrawMultiplier);
    breakdown += ` × ${rule.selfDrawMultiplier} (自摸)`;
  }
  
  // Full shoot vs half shoot affects who pays
  if (rule.fullShoot) {
    // Full shoot: discarder pays all (or all pay on self-draw)
    if (isSelfDraw) {
      // On self-draw in full shoot: all other players pay
      return {
        winnerPoints: winnerPoints * 3,
        loserPoints: -winnerPoints,
        breakdown
      };
    } else {
      // On discard: discarder pays all
      return {
        winnerPoints: winnerPoints,
        loserPoints: -winnerPoints,
        breakdown
      };
    }
  } else {
    // Half shoot
    if (isSelfDraw) {
      // On self-draw: all other players pay
      return {
        winnerPoints: winnerPoints * 3,
        loserPoints: -winnerPoints,
        breakdown
      };
    } else {
      // On discard: discarder pays all (same as full shoot for discard)
      return {
        winnerPoints: winnerPoints,
        loserPoints: -winnerPoints,
        breakdown
      };
    }
  }
}

// Local storage helpers
const CUSTOM_RULES_KEY = 'mahjongCustomRules';

export function getCustomRules(): GameRule[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(CUSTOM_RULES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom rules:', e);
  }
  return [];
}

export function saveCustomRules(rules: GameRule[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving custom rules:', e);
  }
}

export function addCustomRule(rule: Omit<GameRule, 'id' | 'isPreset'>): GameRule {
  const newRule: GameRule = {
    ...rule,
    id: `custom-${Date.now()}`,
    isPreset: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const existing = getCustomRules();
  saveCustomRules([...existing, newRule]);
  
  return newRule;
}

export function updateCustomRule(id: string, updates: Partial<GameRule>): GameRule | null {
  const existing = getCustomRules();
  const index = existing.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  const updated = {
    ...existing[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  existing[index] = updated;
  saveCustomRules(existing);
  
  return updated;
}

export function deleteCustomRule(id: string): boolean {
  const existing = getCustomRules();
  const filtered = existing.filter(r => r.id !== id);
  
  if (filtered.length === existing.length) return false;
  
  saveCustomRules(filtered);
  return true;
}

export function getAllRules(): GameRule[] {
  return [...PRESET_RULES, ...getCustomRules()];
}

export function getRuleById(id: string): GameRule | undefined {
  return getAllRules().find(r => r.id === id);
}

// Duplicate a preset rule to create a custom one
export function duplicatePresetRule(presetId: string, newName?: string): GameRule | null {
  const preset = PRESET_RULES.find(r => r.id === presetId);
  if (!preset) return null;
  
  return addCustomRule({
    ...preset,
    name: newName || `${preset.name} (複製)`
  });
}

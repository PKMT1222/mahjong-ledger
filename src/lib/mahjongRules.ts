// Mahjong Scoring Rules Definitions

export type GameVariant = 'hongkong' | 'taiwan' | 'japanese' | 'custom';

// Base scoring configuration for each variant
export interface VariantConfig {
  id: GameVariant;
  name: string;
  nameEn: string;
  description: string;
  // Base points
  basePoints: number;
  // Scoring unit name (tai/han/fan)
  scoringUnit: string;
  // Self-draw multiplier
  selfDrawMultiplier: number;
  // Dealer bonus (extra points or multiplier)
  dealerBonus: number;
  dealerRepeatBonus: number;
  // Special elements
  hasFlowers: boolean;
  hasKongs: boolean;
  hasRiichi: boolean;
  hasHonba: boolean;
  // Minimum han/tai to win
  minimumWin: number;
  // Maximum han/tai limit
  maximumWin: number;
  // Point limits (for Japanese)
  limitHands?: {
    mangan: number;
    haneman: number;
    baiman: number;
    sanbaiman: number;
    yakuman: number;
  };
  // Fu calculation (Japanese only)
  useFu: boolean;
  // Payment structure
  paymentStructure: 'diff' | 'same'; // diff = different payment, same = same payment
}

// Standard Hong Kong Fan Points Table (Exponential)
// 出銃: 支付基本分數
// 自摸: 每家支付 (基本分數 × 0.5)
// 包自摸: 包家支付 (基本分數 × 1.5)
export const HONG_KONG_FAN_TABLE: Record<number, number> = {
  0: 1,   // 雞胡 = 1分
  1: 2,   // 1番 = 2分
  2: 4,   // 2番 = 4分
  3: 8,   // 3番 = 8分 (自摸每家付 8×0.5=4分)
  4: 16,  // 4番 = 16分
  5: 24,  // 5番 = 24分
  6: 32,  // 6番 = 32分
  7: 48,  // 7番 = 48分
  8: 64,  // 8番 = 64分
  9: 96,  // 9番 = 96分
  10: 128, // 10番 = 128分
  11: 192, // 11番 = 192分
  12: 256, // 12番 = 256分
  13: 384, // 13番 = 384分
};

// Variant Configurations
export const VARIANT_CONFIGS: Record<GameVariant, VariantConfig> = {
  hongkong: {
    id: 'hongkong',
    name: '香港麻雀',
    nameEn: 'Hong Kong Mahjong',
    description: '13張 · 番數制 · 標準計分',
    basePoints: 1, // Base unit, actual points from HONG_KONG_FAN_TABLE
    scoringUnit: '番',
    selfDrawMultiplier: 0.5, // 自摸：每家付基本分數 × 0.5
    dealerBonus: 0,
    dealerRepeatBonus: 0,
    hasFlowers: true,
    hasKongs: true,
    hasRiichi: false,
    hasHonba: false,
    minimumWin: 0, // 雞胡 (0番) allowed
    maximumWin: 13,
    useFu: false,
    paymentStructure: 'same',
  },
  
  taiwan: {
    id: 'taiwan',
    name: '台灣麻將',
    nameEn: 'Taiwan Mahjong',
    description: '16張 · 台數制 · 連莊拉莊',
    basePoints: 100, // 1台 = 100 points (base)
    scoringUnit: '台',
    selfDrawMultiplier: 1, // All pay on self-draw, but dealer pays double
    dealerBonus: 1, // Dealer gets +1台
    dealerRepeatBonus: 1, // +1台 per dealer repeat
    hasFlowers: true,
    hasKongs: true,
    hasRiichi: false,
    hasHonba: false,
    minimumWin: 1, // Must have at least 1台
    maximumWin: 50, // No real limit, but practically ~50
    useFu: false,
    paymentStructure: 'diff', // Dealer pays differently
  },
  
  japanese: {
    id: 'japanese',
    name: '日本麻雀',
    nameEn: 'Japanese (Riichi) Mahjong',
    description: '立直 · 符點制 · 積棒子',
    basePoints: 1000, // Base unit
    scoringUnit: '番',
    selfDrawMultiplier: 1, // Complex calculation based on fu and han
    dealerBonus: 0,
    dealerRepeatBonus: 0,
    hasFlowers: false,
    hasKongs: true,
    hasRiichi: true,
    hasHonba: true, // 積棒子 (repeat counter)
    minimumWin: 1, // Must have at least 1 han (yaku)
    maximumWin: 13, // Yakuman = 13 han (or more for double yakuman)
    limitHands: {
      mangan: 5,      // 5 han = 8000 points
      haneman: 6,     // 6-7 han = 12000 points
      baiman: 8,      // 8-10 han = 16000 points
      sanbaiman: 11,  // 11-12 han = 24000 points
      yakuman: 13,    // 13+ han = 32000 points
    },
    useFu: true,
    paymentStructure: 'diff',
  },
  
  custom: {
    id: 'custom',
    name: '自訂規則',
    nameEn: 'Custom Rules',
    description: '自定義設定',
    basePoints: 1,
    scoringUnit: '分',
    selfDrawMultiplier: 2,
    dealerBonus: 0,
    dealerRepeatBonus: 0,
    hasFlowers: true,
    hasKongs: true,
    hasRiichi: false,
    hasHonba: false,
    minimumWin: 0,
    maximumWin: 100,
    useFu: false,
    paymentStructure: 'same',
  },
};

// Hand types by variant
export const HAND_TYPES_BY_VARIANT: Record<GameVariant, { name: string; value: number; category: string }[]> = {
  hongkong: [
    // Basic Hands (基本)
    { name: '雞胡', value: 0, category: 'basic' },
    { name: '無花', value: 1, category: 'basic' },
    
    // Flower Hands (花牌) - Common HK rule: flowers = +1 fan each, max 2
    { name: '正花', value: 1, category: 'flower' },
    { name: '一花', value: 1, category: 'flower' },
    { name: '兩花', value: 2, category: 'flower' },
    { name: '三花', value: 3, category: 'flower' },
    { name: '四花', value: 4, category: 'flower' },
    
    // Win Methods (食糊方式)
    { name: '自摸', value: 1, category: 'win' },
    { name: '門前清', value: 1, category: 'win' },
    { name: '河底撈魚', value: 1, category: 'win' },
    
    // Combination Hands (組合)
    { name: '一般高', value: 1, category: 'combination' },
    { name: '碰碰胡', value: 3, category: 'combination' },
    { name: '對對糊', value: 3, category: 'combination' },
    { name: '七對', value: 4, category: 'combination' },
    { name: '豪華七對', value: 7, category: 'combination' },
    
    // Suit Hands (花色)
    { name: '混一色', value: 3, category: 'suit' },
    { name: '清一色', value: 7, category: 'suit' },
    
    // Terminal & Honor (么九、番子)
    { name: '混么九', value: 4, category: 'terminal' },
    { name: '清么九', value: 7, category: 'terminal' },
    { name: '小三元', value: 5, category: 'honor' },
    { name: '大三元', value: 8, category: 'honor' },
    { name: '小四喜', value: 10, category: 'honor' },
    { name: '大四喜', value: 13, category: 'honor' },
    { name: '字一色', value: 13, category: 'honor' },
    
    // Kong Related (槓牌)
    { name: '暗槓', value: 1, category: 'kong' },
    { name: '明槓', value: 0, category: 'kong' },
    { name: '槓上開花', value: 3, category: 'kong' },
    { name: '搶槓', value: 3, category: 'kong' },
    
    // Special (特殊牌型)
    { name: '十三么', value: 13, category: 'special' },
    { name: '十八羅漢', value: 13, category: 'special' },
    { name: '天胡', value: 13, category: 'special' },
    { name: '地胡', value: 13, category: 'special' },
  ],
  
  taiwan: [
    { name: '平胡', value: 1, category: 'basic' },
    { name: '斷么九', value: 1, category: 'basic' },
    { name: '缺一門', value: 1, category: 'basic' },
    { name: '無字', value: 1, category: 'basic' },
    { name: '正花', value: 1, category: 'flower' },
    { name: '春夏秋冬', value: 2, category: 'flower' },
    { name: '梅蘭菊竹', value: 2, category: 'flower' },
    { name: '一般高', value: 1, category: 'combination' },
    { name: '喜相逢', value: 1, category: 'combination' },
    { name: '連六', value: 1, category: 'combination' },
    { name: '老少配', value: 1, category: 'combination' },
    { name: '三暗刻', value: 2, category: 'combination' },
    { name: '對對胡', value: 2, category: 'combination' },
    { name: '七對子', value: 2, category: 'combination' },
    { name: '清一色', value: 4, category: 'suit' },
    { name: '混一色', value: 2, category: 'suit' },
    { name: '小三元', value: 4, category: 'honor' },
    { name: '大三元', value: 8, category: 'honor' },
    { name: '小四喜', value: 8, category: 'honor' },
    { name: '大四喜', value: 16, category: 'honor' },
    { name: '字一色', value: 8, category: 'honor' },
    { name: '天胡', value: 16, category: 'limit' },
    { name: '地胡', value: 16, category: 'limit' },
    { name: '槓上開花', value: 1, category: 'kong' },
    { name: '海底撈月', value: 1, category: 'special' },
  ],
  
  japanese: [
    // 1 Han
    { name: '立直', value: 1, category: 'yaku' },
    { name: '一発', value: 1, category: 'yaku' },
    { name: '門前清自摸和', value: 1, category: 'yaku' },
    { name: '平和', value: 1, category: 'yaku' },
    { name: '断幺九', value: 1, category: 'yaku' },
    { name: '一盃口', value: 1, category: 'yaku' },
    { name: '役牌 白', value: 1, category: 'yaku' },
    { name: '役牌 發', value: 1, category: 'yaku' },
    { name: '役牌 中', value: 1, category: 'yaku' },
    { name: '役牌 自風', value: 1, category: 'yaku' },
    { name: '役牌 場風', value: 1, category: 'yaku' },
    { name: '嶺上開花', value: 1, category: 'yaku' },
    { name: '海底撈月', value: 1, category: 'yaku' },
    { name: '河底撈魚', value: 1, category: 'yaku' },
    { name: '槍槓', value: 1, category: 'yaku' },
    // 2 Han
    { name: 'ダブル立直', value: 2, category: 'yaku' },
    { name: '七対子', value: 2, category: 'yaku' },
    { name: '混全帯幺九', value: 2, category: 'yaku' },
    { name: '一気通貫', value: 2, category: 'yaku' },
    { name: '三色同順', value: 2, category: 'yaku' },
    { name: '三色同刻', value: 2, category: 'yaku' },
    { name: '三暗刻', value: 2, category: 'yaku' },
    { name: '小三元', value: 2, category: 'yaku' },
    { name: '混老頭', value: 2, category: 'yaku' },
    // 3 Han
    { name: '二盃口', value: 3, category: 'yaku' },
    { name: '純全帯幺九', value: 3, category: 'yaku' },
    { name: '混一色', value: 3, category: 'yaku' },
    // 6 Han
    { name: '清一色', value: 6, category: 'yaku' },
    // Yakuman (13 Han)
    { name: '天和', value: 13, category: 'yakuman' },
    { name: '地和', value: 13, category: 'yakuman' },
    { name: '大三元', value: 13, category: 'yakuman' },
    { name: '四暗刻', value: 13, category: 'yakuman' },
    { name: '字一色', value: 13, category: 'yakuman' },
    { name: '緑一色', value: 13, category: 'yakuman' },
    { name: '清老頭', value: 13, category: 'yakuman' },
    { name: '国士無双', value: 13, category: 'yakuman' },
    { name: '小四喜', value: 13, category: 'yakuman' },
    { name: '四槓子', value: 13, category: 'yakuman' },
    { name: '九蓮宝燈', value: 13, category: 'yakuman' },
  ],
  
  custom: [
    { name: '自訂1', value: 1, category: 'custom' },
    { name: '自訂2', value: 2, category: 'custom' },
    { name: '自訂3', value: 3, category: 'custom' },
    { name: '自訂5', value: 5, category: 'custom' },
    { name: '自訂8', value: 8, category: 'custom' },
    { name: '自訂13', value: 13, category: 'custom' },
  ],
};

// Scoring Functions
export function calculateHongKongScore(
  fan: number,
  isSelfDraw: boolean,
  isDealer: boolean,
  config: VariantConfig
): { winnerPoints: number; loserPoints: number; breakdown: string } {
  const basePoints = HONG_KONG_FAN_TABLE[fan] || fan * 2;
  
  if (isSelfDraw) {
    // 自摸：每家支付 (基本分數 × 0.5)
    const perPersonPayment = Math.round(basePoints * 0.5);
    const totalWin = perPersonPayment * 3;
    const breakdown = `${fan}番 = ${basePoints}分，自摸每家 ${basePoints}×0.5 = ${perPersonPayment}分，共收 ${totalWin}分`;
    
    return {
      winnerPoints: totalWin,
      loserPoints: -perPersonPayment,
      breakdown,
    };
  }
  
  // 出銃：出銃者支付全部番數分數
  const breakdown = `${fan}番 = ${basePoints}分 (出銃)`;
  return {
    winnerPoints: basePoints,
    loserPoints: -basePoints,
    breakdown,
  };
}

export function calculateTaiwanScore(
  tai: number,
  isSelfDraw: boolean,
  isDealer: boolean,
  dealerRepeat: number,
  config: VariantConfig
): { winnerPoints: number; loserPoints: number; breakdown: string } {
  let totalTai = tai;
  let breakdown = `${tai}台`;
  
  // Dealer gets +1台, and +1 per repeat
  if (isDealer) {
    totalTai += config.dealerBonus + (dealerRepeat * config.dealerRepeatBonus);
    breakdown += ` + ${config.dealerBonus}台 (莊家)`;
    if (dealerRepeat > 0) {
      breakdown += ` + ${dealerRepeat}台 (連${dealerRepeat})`;
    }
  }
  
  // Self-draw: all other players pay (dealer pays double if not winner)
  // Discard: only discarder pays
  let points = totalTai * config.basePoints;
  breakdown += ` × ${config.basePoints} = ${points}分`;
  
  return {
    winnerPoints: isSelfDraw ? points * 3 : points,
    loserPoints: -points,
    breakdown,
  };
}

export function calculateJapaneseScore(
  han: number,
  fu: number,
  isSelfDraw: boolean,
  isDealer: boolean,
  honba: number,
  config: VariantConfig
): { winnerPoints: number; loserPoints: number; breakdown: string } {
  // Apply limit hands
  let effectiveHan = han;
  let limitName = '';
  
  if (config.limitHands) {
    if (han >= config.limitHands.yakuman) {
      effectiveHan = config.limitHands.yakuman;
      limitName = '役満';
    } else if (han >= config.limitHands.sanbaiman) {
      effectiveHan = config.limitHands.sanbaiman;
      limitName = '三倍満';
    } else if (han >= config.limitHands.baiman) {
      effectiveHan = config.limitHands.baiman;
      limitName = '倍満';
    } else if (han >= config.limitHands.haneman) {
      effectiveHan = config.limitHands.haneman;
      limitName = '跳満';
    } else if (han >= config.limitHands.mangan) {
      effectiveHan = config.limitHands.mangan;
      limitName = '満貫';
    }
  }
  
  // Basic calculation: fu * 2^(han+2)
  let basePoints = fu * Math.pow(2, effectiveHan + 2);
  
  // Apply limit
  if (config.limitHands && han >= 5) {
    basePoints = Math.min(basePoints, effectiveHan * 1000);
  }
  
  // Round up to nearest 100
  basePoints = Math.ceil(basePoints / 100) * 100;
  
  // Honba bonus (300 points per repeat counter)
  const honbaBonus = honba * 300;
  
  let winnerPoints: number;
  let loserPoints: number;
  let breakdown = `${han}番${fu > 20 ? ` ${fu}符` : ''}`;
  if (limitName) breakdown += ` ${limitName}`;
  
  if (isDealer) {
    if (isSelfDraw) {
      // Dealer tsumo: each player pays 1/3
      winnerPoints = Math.ceil((basePoints * 3 + honbaBonus * 3) / 100) * 100;
      loserPoints = -Math.ceil((basePoints + honbaBonus) / 100) * 100;
      breakdown += ' (莊家自摸)';
    } else {
      // Dealer ron: discarder pays all
      winnerPoints = basePoints * 6 + honbaBonus * 3;
      loserPoints = -(basePoints * 6 + honbaBonus * 3);
      breakdown += ' (莊家榮和)';
    }
  } else {
    if (isSelfDraw) {
      // Non-dealer tsumo: dealer pays half, others pay quarter
      winnerPoints = basePoints * 3 + honbaBonus * 3;
      loserPoints = -(basePoints + honbaBonus);
      breakdown += ' (自摸)';
    } else {
      // Non-dealer ron: discarder pays
      winnerPoints = basePoints * 4 + honbaBonus * 3;
      loserPoints = -(basePoints * 4 + honbaBonus * 3);
      breakdown += ' (榮和)';
    }
  }
  
  return { winnerPoints, loserPoints, breakdown };
}

// Main scoring function
export function calculateScore(
  variant: GameVariant,
  params: {
    value: number; // tai/han
    fu?: number; // for Japanese
    isSelfDraw: boolean;
    isDealer: boolean;
    dealerRepeat?: number; // for Taiwan
    honba?: number; // for Japanese
  },
  config: VariantConfig
): { winnerPoints: number; loserPoints: number; breakdown: string } {
  switch (variant) {
    case 'taiwan':
      return calculateTaiwanScore(
        params.value,
        params.isSelfDraw,
        params.isDealer,
        params.dealerRepeat || 0,
        config
      );
    case 'japanese':
      return calculateJapaneseScore(
        params.value,
        params.fu || 30,
        params.isSelfDraw,
        params.isDealer,
        params.honba || 0,
        config
      );
    case 'hongkong':
    case 'custom':
    default:
      return calculateHongKongScore(
        params.value,
        params.isSelfDraw,
        params.isDealer,
        config
      );
  }
}

// Documentation
export const RULES_DOCUMENTATION = `
# 麻雀計分規則說明

## 香港麻雀 (Hong Kong Mahjong)

### 基本規則
- 13張牌
- 番數制
- 雞胡 (0番) 允許
- 自摸 2倍

### 計分方式
- 每番 = 1分 (底分)
- 自摸 = 分數 × 2
- 出統 = 出統者付全部

### 常見牌型
- 雞胡: 0番
- 清一色: 7番
- 碰碰胡: 3番
- 大三元: 8番

## 台灣麻將 (Taiwan Mahjong)

### 基本規則
- 16張牌
- 台數制
- 必須至少 1台
- 連莊拉莊 (+1台每局)

### 計分方式
- 每台 = 100分 (底分)
- 莊家 +1台
- 連莊每局額外 +1台
- 自摸時三家各付，莊家付雙倍

### 常見牌型
- 平胡: 1台
- 清一色: 4台
- 大三元: 8台
- 大四喜: 16台

## 日本麻雀 (Japanese/Riichi Mahjong)

### 基本規則
- 13張牌
- 符點制 (符 × 2^(番+2))
- 必須有役 (至少1番)
- 立直制度

### 計分方式
- 基本公式: 符 × 2^(番+2)
- 滿貫: 5番以上有上限
- 自摸/榮和計分不同
- 莊家有加成

### 滿貫一覽
- 5番 (満貫): 8000點
- 6-7番 (跳満): 12000點
- 8-10番 (倍満): 16000點
- 11-12番 (三倍満): 24000點
- 13番+ (役満): 32000點

### 常見役種
- 立直: 1番
- 断幺九: 1番
- 平和: 1番
- 清一色: 6番
- 国士無双: 役満
`;

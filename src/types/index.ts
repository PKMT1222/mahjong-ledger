// Game Variants
export type GameVariant = 'taiwan' | 'japanese' | 'hongkong' | 'hk-taiwan' | 'paoma';

export interface Player {
  id: number;
  name: string;
  created_at: string;
  // Stats (optional, from API)
  games_played?: number;
  total_score?: number;
  wins?: number;
  self_draws?: number;
  deal_ins?: number;
}

export interface Game {
  id: number;
  name: string;
  variant: GameVariant;
  status: 'active' | 'completed';
  settings: GameSettings;
  created_at: string;
  completed_at?: string;
}

export interface GameSettings {
  // Taiwan / HK-Taiwan
  baseScore?: number;        // 底
  taiScore?: number;         // 台/番
  dealerBonus?: number;      // 莊家台/番
  
  // Japanese
  startPoints?: number;      // 原點 (25000)
  returnPoints?: number;     // 返點 (30000)
  umaPoints?: number[];      // 馬點 [1st, 2nd, 3rd, 4th]
  notenPenalty?: number;     // 不聽罰符
  
  // Hong Kong
  fullLiability?: boolean;   // 全銃
  selfDrawMultiplier?: number; // 自摸倍數
  jackpotEnabled?: boolean;  // Jackpot
  
  // Common
  maxPlayers?: number;
  autoScore?: boolean;       // 自動計算
  doorDiceDouble?: boolean;  // 門骰加倍
}

export interface GamePlayer {
  id: number;
  game_id: number;
  player_id: number;
  seat_position: number;     // 東1, 南2, 西3, 北4
  player_name?: string;
  final_score: number;
  is_dealer: boolean;
  // Statistics
  wins: number;
  self_draws: number;
  deal_ins: number;
  riichi_count: number;
}

export interface Round {
  id: number;
  game_id: number;
  round_number: number;
  round_wind: string;        // 東, 南, 西, 北
  hand_number: number;       // 1, 2, 3, 4
  dealer_id: number;
  dealer_position: number;
  
  // Results
  winner_ids: number[];      // Support multiple winners (一炮多響)
  loser_id?: number;         // Who dealt in
  is_self_draw: boolean;
  
  // Scoring
  hand_type: string;
  base_tai: number;          // 底/台
  dealer_repeat: number;     // 連莊數
  total_points: number;
  
  // Special
  is_bao_zimo: boolean;      // 包自摸
  is_liichi: boolean;        // 立直
  is_kong: boolean;          // 槓
  is_surrender: boolean;     // 投降
  is_false_win: boolean;     // 詐胡
  
  // Calculated scores per player
  player_scores: { [playerId: number]: number };
  
  created_at: string;
}

export interface Transaction {
  id: number;
  round_id: number;
  from_player_id: number;
  to_player_id: number;
  amount: number;
  reason: string;
  created_at: string;
}

// Statistics
export interface PlayerStats {
  player_id: number;
  player_name: string;
  games_played: number;
  total_score: number;
  wins: number;
  self_draws: number;
  deal_ins: number;
  win_rate: number;
  self_draw_rate: number;
  deal_in_rate: number;
  // Titles
  titles: string[];          // 食糊王, 自摸王, 出統王
}

// Hand Types by Variant
export const HAND_TYPES: Record<GameVariant, { name: string; tai: number }[]> = {
  taiwan: [
    { name: '平胡', tai: 1 },
    { name: '斷么九', tai: 1 },
    { name: '缺一門', tai: 1 },
    { name: '無字', tai: 1 },
    { name: '一般高', tai: 1 },
    { name: '喜相逢', tai: 1 },
    { name: '連六', tai: 1 },
    { name: '老少配', tai: 1 },
    { name: '箭刻', tai: 1 },
    { name: '圈風刻', tai: 1 },
    { name: '門風刻', tai: 1 },
    { name: '門前清', tai: 1 },
    { name: '平和', tai: 1 },
    { name: '正花', tai: 1 },
    { name: '春夏秋冬', tai: 2 },
    { name: '梅蘭菊竹', tai: 2 },
    { name: '三暗刻', tai: 2 },
    { name: '雙同刻', tai: 2 },
    { name: '對對胡', tai: 2 },
    { name: '小三元', tai: 2 },
    { name: '混老頭', tai: 2 },
    { name: '七對子', tai: 2 },
    { name: '花槓', tai: 2 },
    { name: '三槓子', tai: 2 },
    { name: '五門齊', tai: 2 },
    { name: '清一色', tai: 3 },
    { name: '小四喜', tai: 3 },
    { name: '字一色', tai: 3 },
    { name: '四暗刻', tai: 3 },
    { name: '槓上開花', tai: 1 },
    { name: '海底撈月', tai: 1 },
    { name: '搶槓', tai: 1 },
    { name: '全求人', tai: 1 },
    { name: '大三元', tai: 4 },
    { name: '大四喜', tai: 4 },
    { name: '清老頭', tai: 4 },
    { name: '四槓子', tai: 4 },
    { name: '天胡', tai: 8 },
    { name: '地胡', tai: 8 },
    { name: '人胡', tai: 8 },
    { name: '八仙過海', tai: 8 },
  ],
  japanese: [
    { name: '立直', tai: 1 },
    { name: '一発', tai: 1 },
    { name: '門前清自摸和', tai: 1 },
    { name: '平和', tai: 1 },
    { name: '断幺九', tai: 1 },
    { name: '一盃口', tai: 1 },
    { name: '役牌 白', tai: 1 },
    { name: '役牌 發', tai: 1 },
    { name: '役牌 中', tai: 1 },
    { name: '役牌 自風', tai: 1 },
    { name: '役牌 場風', tai: 1 },
    { name: '嶺上開花', tai: 1 },
    { name: '海底撈月', tai: 1 },
    { name: '河底撈魚', tai: 1 },
    { name: '槍槓', tai: 1 },
    { name: 'ダブル立直', tai: 2 },
    { name: '七対子', tai: 2 },
    { name: '混全帯幺九', tai: 2 },
    { name: '一気通貫', tai: 2 },
    { name: '三色同順', tai: 2 },
    { name: '三色同刻', tai: 2 },
    { name: '三暗刻', tai: 2 },
    { name: '小三元', tai: 2 },
    { name: '混老頭', tai: 2 },
    { name: '三槓子', tai: 2 },
    { name: '二盃口', tai: 3 },
    { name: '純全帯幺九', tai: 3 },
    { name: '混一色', tai: 3 },
    { name: '清一色', tai: 6 },
    { name: '流し満貫', tai: 5 },
    { name: '天和', tai: 13 },
    { name: '地和', tai: 13 },
    { name: '大三元', tai: 13 },
    { name: '四暗刻', tai: 13 },
    { name: '字一色', tai: 13 },
    { name: '緑一色', tai: 13 },
    { name: '清老頭', tai: 13 },
    { name: '国士無双', tai: 13 },
    { name: '小四喜', tai: 13 },
    { name: '四槓子', tai: 13 },
    { name: '九蓮宝燈', tai: 13 },
    { name: '八連荘', tai: 13 },
    { name: '四暗刻単騎', tai: 26 },
    { name: '国士無双十三面', tai: 26 },
    { name: '純正九蓮宝燈', tai: 26 },
    { name: '大四喜', tai: 26 },
  ],
  hongkong: [
    { name: '雞胡', tai: 0 },
    { name: '碰碰胡', tai: 3 },
    { name: '混一色', tai: 3 },
    { name: '清一色', tai: 7 },
    { name: '混么九', tai: 7 },
    { name: '清么九', tai: 7 },
    { name: '小三元', tai: 5 },
    { name: '大三元', tai: 8 },
    { name: '小四喜', tai: 10 },
    { name: '大四喜', tai: 13 },
    { name: '字一色', tai: 13 },
    { name: '槓上槓', tai: 8 },
    { name: '槓上開花', tai: 3 },
    { name: '十八羅漢', tai: 13 },
    { name: '十三幺', tai: 13 },
    { name: '七對', tai: 4 },
    { name: '花胡', tai: 3 },
    { name: '無花', tai: 1 },
    { name: '自摸', tai: 1 },
  ],
  'hk-taiwan': [
    { name: '平胡', tai: 1 },
    { name: '一般高', tai: 1 },
    { name: '缺五', tai: 1 },
    { name: '斷么', tai: 1 },
    { name: '八支', tai: 1 },
    { name: '無字', tai: 1 },
    { name: '自摸', tai: 1 },
    { name: '門風', tai: 1 },
    { name: '圈風', tai: 1 },
    { name: '箭刻', tai: 1 },
    { name: '單吊', tai: 1 },
    { name: '邊張', tai: 1 },
    { name: '嵌張', tai: 1 },
    { name: '正花', tai: 1 },
    { name: '花槓', tai: 2 },
    { name: '三暗刻', tai: 2 },
    { name: '碰碰胡', tai: 2 },
    { name: '混一色', tai: 2 },
    { name: '混老頭', tai: 2 },
    { name: '七對子', tai: 2 },
    { name: '小三元', tai: 3 },
    { name: '小四喜', tai: 3 },
    { name: '字一色', tai: 3 },
    { name: '清一色', tai: 3 },
    { name: '四暗刻', tai: 3 },
    { name: '清老頭', tai: 3 },
    { name: '大三元', tai: 5 },
    { name: '大四喜', tai: 5 },
    { name: '槓上開花', tai: 1 },
    { name: '海底撈月', tai: 1 },
    { name: '搶槓', tai: 1 },
    { name: '全求人', tai: 1 },
  ],
  paoma: [
    { name: '雞胡', tai: 0 },
    { name: '碰碰胡', tai: 3 },
    { name: '混一色', tai: 3 },
    { name: '清一色', tai: 7 },
    { name: '小三元', tai: 5 },
    { name: '大三元', tai: 8 },
    { name: '小四喜', tai: 10 },
    { name: '大四喜', tai: 13 },
    { name: '字一色', tai: 13 },
    { name: '十八羅漢', tai: 13 },
    { name: '七對', tai: 4 },
    { name: '槓上開花', tai: 3 },
    { name: '花胡', tai: 3 },
    { name: '無花', tai: 1 },
    { name: '自摸', tai: 1 },
    { name: '一馬', tai: 1 },
    { name: '二馬', tai: 2 },
    { name: '三馬', tai: 3 },
    { name: '四馬', tai: 4 },
    { name: '五馬', tai: 5 },
    { name: '六馬', tai: 6 },
  ],
};

// Wind positions
export const WINDS = ['東', '南', '西', '北'];
export const WIND_EMOJI: Record<string, string> = {
  '東': '🀀',
  '南': '🀁', 
  '西': '🀂',
  '北': '🀃'
};

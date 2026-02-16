// Language types
export type Language = 'zh' | 'en';

export interface Translations {
  [key: string]: string;
}

export const translations = {
  zh: {
    // App
    appTitle: '麻雀記帳',
    appSubtitle: 'Mahjong Ledger',
    
    // Navigation
    home: '主頁',
    history: '歷史',
    statistics: '統計',
    settings: '設定',
    back: '返回',
    
    // Players
    players: '玩家',
    player: '玩家',
    addPlayer: '添加玩家',
    playerName: '玩家名稱',
    noPlayers: '暫無玩家',
    gamesPlayed: '場',
    winRate: '勝率',
    profit: '盈虧',
    
    // Games
    games: '牌局',
    game: '牌局',
    newGame: '新增對局',
    activeGames: '進行中',
    completedGames: '已完成',
    totalGames: '總牌局',
    quickStart: '快速開局',
    needPlayers: '需要4位玩家',
    recentGames: '最近牌局',
    noGames: '暫無牌局',
    startFirstGame: '開始你的第一場麻雀對局',
    deleteGame: '刪除牌局',
    deleteConfirm: '確定要刪除牌局嗎？',
    endGame: '結束牌局',
    endGameConfirm: '確定要結束牌局嗎？',
    
    // Game play
    round: '局',
    wind: '風',
    dealer: '莊',
    dealerRepeat: '連莊',
    score: '分數',
    recordScore: '記分',
    winner: '食糊',
    loser: '出統',
    selfDraw: '自摸',
    handType: '牌型',
    fan: '番',
    confirm: '確認',
    cancel: '取消',
    undo: '還原',
    undoConfirm: '確定要取消上一鋪嗎？',
    historyLog: '紀錄',
    noRounds: '暫無紀錄',
    
    // Winds
    east: '東',
    south: '南',
    west: '西',
    north: '北',
    
    // Settings
    appearance: '外觀',
    theme: '主題',
    language: '語言',
    handTypes: '番種設定',
    save: '保存',
    saved: '已保存',
    reset: '重設',
    
    // Status
    active: '進行中',
    completed: '已完成',
    initializing: '初始化',
    loading: '載入中',
    
    // Errors
    error: '錯誤',
    unknownError: '未知錯誤',
  },
  en: {
    // App
    appTitle: 'Mahjong Ledger',
    appSubtitle: 'Hong Kong Style Scoring',
    
    // Navigation
    home: 'Home',
    history: 'History',
    statistics: 'Stats',
    settings: 'Settings',
    back: 'Back',
    
    // Players
    players: 'Players',
    player: 'Player',
    addPlayer: 'Add Player',
    playerName: 'Player Name',
    noPlayers: 'No players yet',
    gamesPlayed: 'games',
    winRate: 'Win Rate',
    profit: 'Profit/Loss',
    
    // Games
    games: 'Games',
    game: 'Game',
    newGame: 'New Game',
    activeGames: 'Active',
    completedGames: 'Completed',
    totalGames: 'Total Games',
    quickStart: 'Quick Start',
    needPlayers: 'Need 4 players',
    recentGames: 'Recent Games',
    noGames: 'No games yet',
    startFirstGame: 'Start your first mahjong game',
    deleteGame: 'Delete Game',
    deleteConfirm: 'Are you sure you want to delete this game?',
    endGame: 'End Game',
    endGameConfirm: 'Are you sure you want to end this game?',
    
    // Game play
    round: 'Round',
    wind: 'Wind',
    dealer: 'Dealer',
    dealerRepeat: 'Repeat',
    score: 'Score',
    recordScore: 'Record Score',
    winner: 'Winner',
    loser: 'Dealt In',
    selfDraw: 'Self Draw',
    handType: 'Hand Type',
    fan: 'Fan',
    confirm: 'Confirm',
    cancel: 'Cancel',
    undo: 'Undo',
    undoConfirm: 'Undo last round?',
    historyLog: 'Log',
    noRounds: 'No rounds yet',
    
    // Winds
    east: 'East',
    south: 'South',
    west: 'West',
    north: 'North',
    
    // Settings
    appearance: 'Appearance',
    theme: 'Theme',
    language: 'Language',
    handTypes: 'Hand Types',
    save: 'Save',
    saved: 'Saved',
    reset: 'Reset',
    
    // Status
    active: 'Active',
    completed: 'Completed',
    initializing: 'Initialize',
    loading: 'Loading',
    
    // Errors
    error: 'Error',
    unknownError: 'Unknown error',
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang][key as keyof typeof translations.zh] || key;
}

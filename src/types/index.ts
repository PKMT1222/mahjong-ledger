export interface Player {
  id: number;
  name: string;
  created_at: string;
}

export interface Game {
  id: number;
  name: string;
  status: 'active' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface GamePlayer {
  id: number;
  game_id: number;
  player_id: number;
  player_name?: string;
  final_score: number;
}

export interface Round {
  id: number;
  game_id: number;
  round_number: number;
  dealer_id: number;
  winner_id?: number;
  loser_id?: number;
  hand_type?: string;
  points: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  round_id: number;
  from_player_id: number;
  to_player_id: number;
  amount: number;
  reason: string;
}

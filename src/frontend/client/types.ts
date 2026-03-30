export interface ClientServer {
  name: string;
  map: string;
  map_name: string;
  mode: string;
  game_type: string;
  players: number;
  max_players: number;
  bots_per_team: number;
  heroes_enabled: boolean;
  team_damage: boolean;
  auto_aim: boolean;
  password_protected: boolean;
  difficulty: string;
  turns_per_second: number;
  members: ClientMember[];
  raw_settings: Record<string, string>;
}

export interface ClientMember {
  user_id: string;
  username?: string;
  avatar?: string;
  steam_profile?: string;
}

export interface HistorySnapshot {
  t: number;
  p: number;
  s: number;
  maps: Record<string, number>;
  modes: Record<string, number>;
}

export interface ServerResponse {
  servers: ClientServer[];
  total: number;
  fetched_at: string;
}

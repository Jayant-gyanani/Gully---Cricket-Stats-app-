
export enum Role {
  PLAYER = 'PLAYER',
  UMPIRE = 'UMPIRE',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
}

export interface PlayerStats {
  id: string;
  innings: number;
  matches: number; // New: Total matches participated in
  runs: number;
  highestScore: number; // New
  balls: number;
  fours: number;
  sixes: number;
  twos: number;
  ones: number;
  dots: number;
  wideFaced: number; // New
  nbFaced: number; // New
  outs: number;
  ducks: number; // New (Out on 0)
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number; // New
  maxRunsInOver: number; // New
  foursConceded: number; // New
  sixesConceded: number; // New
  twosConceded: number; // New
  onesConceded: number; // New
  dotsBowled: number; // New
  wideBowled: number; // New
  nbBowled: number; // New
}

export interface BallRecord {
  batsmanId: string;
  bowlerId: string;
  type: 'DOT' | 'RUNS' | 'WIDE' | 'NB' | 'OUT';
  runs: number;
  nbValue?: string;
}

export interface Over {
  balls: BallRecord[];
  bowlerId: string;
  isCompleted: boolean;
}

export interface Inning {
  battingTeamId: 'A' | 'B';
  score: number;
  wickets: number;
  overs: Over[];
  currentOverIndex: number;
  allOut: boolean;
  dismissedPlayerIds: string[];
}

export interface Match {
  id: string;
  date: string;
  maxOvers: number;
  teamA: {
    captainId: string;
    players: string[];
  };
  teamB: {
    captainId: string;
    players: string[];
  };
  commons: string[];
  others: number;
  toss: {
    winnerId: 'A' | 'B';
    choice: 'BAT' | 'BOWL';
  };
  innings: Inning[];
  status: 'LIVE' | 'FINISHED' | 'COMPLETED' | 'DRAW';
  winner?: 'A' | 'B' | 'DRAW' | 'TIE';
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  playersStats: Record<string, PlayerStats>;
  commonStats: Record<string, PlayerStats>;
  history: Match[];
  liveMatch: Match | null;
}

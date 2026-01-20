
import { Role, User } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'admin1', username: 'admin', password: '123', role: Role.ADMIN },
  { id: 'umpire1', username: 'umpire', password: '123', role: Role.UMPIRE },
  { id: 'player1', username: 'rohit', password: '123', role: Role.PLAYER },
  { id: 'player2', username: 'virat', password: '123', role: Role.PLAYER },
  { id: 'player3', username: 'dhoni', password: '123', role: Role.PLAYER },
  { id: 'player4', username: 'hardik', password: '123', role: Role.PLAYER },
  { id: 'player5', username: 'bumrah', password: '123', role: Role.PLAYER },
];

export const COLORS = {
  primary: '#1e40af', // blue-800
  secondary: '#0f172a', // slate-900
  accent: '#fbbf24', // amber-400
  success: '#22c55e', // green-500
  danger: '#ef4444', // red-500
};

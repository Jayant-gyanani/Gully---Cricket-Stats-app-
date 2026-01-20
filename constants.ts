
import { Role, User } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'admin1', username: 'admin', password: '190805', role: Role.ADMIN },
  { id: 'umpire1', username: 'umpire', password: '321', role: Role.UMPIRE },
];

export const COLORS = {
  primary: '#1e40af', // blue-800
  secondary: '#0f172a', // slate-900
  accent: '#fbbf24', // amber-400
  success: '#22c55e', // green-500
  danger: '#ef4444', // red-500
};

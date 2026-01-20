
import React from 'react';
import { AppState, Match, User, Role, PlayerStats, BallRecord } from './types';
import { INITIAL_USERS } from './constants';

const STORAGE_KEY = 'gully_cricket_app_state_v2';

const getInitialStats = (id: string): PlayerStats => ({
  id, innings: 0, matches: 0, runs: 0, highestScore: 0, balls: 0, 
  fours: 0, sixes: 0, twos: 0, ones: 0, dots: 0, 
  wideFaced: 0, nbFaced: 0, outs: 0, ducks: 0,
  wickets: 0, oversBowled: 0, runsConceded: 0, 
  maidens: 0, maxRunsInOver: 0, 
  foursConceded: 0, sixesConceded: 0, twosConceded: 0, onesConceded: 0,
  dotsBowled: 0, wideBowled: 0, nbBowled: 0
});

const loadState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  
  const state: AppState = {
    users: INITIAL_USERS,
    currentUser: null,
    playersStats: {},
    commonStats: {},
    history: [],
    liveMatch: null
  };

  INITIAL_USERS.forEach(u => {
    if (u.role === Role.PLAYER) {
      state.playersStats[u.id] = getInitialStats(u.id);
      state.commonStats[u.id] = getInitialStats(u.id);
    }
  });

  return state;
};

export const useAppStore = () => {
  const [state, setState] = React.useState<AppState>(loadState());

  const updateState = React.useCallback((updates: Partial<AppState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const login = (username: string, password: string) => {
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      updateState({ currentUser: user });
      return true;
    }
    return false;
  };

  const calculateAndSaveStats = (match: Match) => {
    const newStats = { ...state.playersStats };
    const newCommonStats = { ...state.commonStats };

    // Mark match played for all participants
    const participants = [...match.teamA.players, ...match.teamB.players, ...match.commons];
    participants.forEach(id => {
      if (id.startsWith('OTHER')) return;
      const isCommon = match.commons.includes(id);
      const target = isCommon ? newCommonStats : newStats;
      if (!target[id]) target[id] = getInitialStats(id);
      target[id].matches += 1;
    });

    match.innings.forEach(inning => {
      // Temporary storage to track individual batsman scores in THIS inning
      const inningScores: Record<string, number> = {};

      inning.overs.forEach(over => {
        let overRuns = 0;
        let isMaiden = over.balls.length > 0;

        over.balls.forEach(ball => {
          // BATTING STATS
          if (!ball.batsmanId.startsWith('OTHER')) {
            const isCommon = match.commons.includes(ball.batsmanId);
            const targetStats = isCommon ? newCommonStats : newStats;
            if (!targetStats[ball.batsmanId]) targetStats[ball.batsmanId] = getInitialStats(ball.batsmanId);
            const p = targetStats[ball.batsmanId];

            if (!inningScores[ball.batsmanId]) inningScores[ball.batsmanId] = 0;

            if (ball.type !== 'WIDE' && ball.type !== 'NB') {
              p.balls += 1;
              p.runs += ball.runs;
              inningScores[ball.batsmanId] += ball.runs;
              
              if (ball.runs === 0) p.dots += 1;
              if (ball.runs === 1) p.ones += 1;
              if (ball.runs === 2) p.twos += 1;
              if (ball.runs === 4) p.fours += 1;
              if (ball.runs === 6) p.sixes += 1;
            } else {
              if (ball.type === 'WIDE') p.wideFaced += 1;
              if (ball.type === 'NB') p.nbFaced += 1;
              // No-balls can have runs from the bat
              p.runs += ball.runs;
              inningScores[ball.batsmanId] += ball.runs;
            }

            if (ball.type === 'OUT' || ball.nbValue === 'OUT') {
              p.outs += 1;
              if (inningScores[ball.batsmanId] === 0) p.ducks += 1;
            }
            
            // Update Highest Score
            if (inningScores[ball.batsmanId] > p.highestScore) {
              p.highestScore = inningScores[ball.batsmanId];
            }
          }

          // BOWLING STATS
          if (!ball.bowlerId.startsWith('OTHER')) {
            const isCommon = match.commons.includes(ball.bowlerId);
            const bStats = isCommon ? newCommonStats : newStats;
            if (!bStats[ball.bowlerId]) bStats[ball.bowlerId] = getInitialStats(ball.bowlerId);
            const b = bStats[ball.bowlerId];
            
            b.runsConceded += ball.runs;
            overRuns += ball.runs;

            if (ball.type === 'OUT') b.wickets += 1;
            if (ball.type === 'WIDE') b.wideBowled += 1;
            if (ball.type === 'NB') b.nbBowled += 1;
            if (ball.type === 'DOT' || (ball.type === 'RUNS' && ball.runs === 0)) b.dotsBowled += 1;

            if (ball.runs === 1) b.onesConceded += 1;
            if (ball.runs === 2) b.twosConceded += 1;
            if (ball.runs === 4) b.foursConceded += 1;
            if (ball.runs === 6) b.sixesConceded += 1;

            if (ball.runs > 0 || ball.type === 'WIDE' || ball.type === 'NB') {
              isMaiden = false;
            }
          }
        });

        // End of over checks for bowler
        if (!over.bowlerId.startsWith('OTHER')) {
          const isCommon = match.commons.includes(over.bowlerId);
          const bStats = isCommon ? newCommonStats : newStats;
          const b = bStats[over.bowlerId];
          b.oversBowled += 1;
          if (isMaiden && over.balls.length >= 6) b.maidens += 1;
          if (overRuns > b.maxRunsInOver) b.maxRunsInOver = overRuns;
        }
      });
    });

    updateState({
      playersStats: newStats,
      commonStats: newCommonStats,
      history: [...state.history, match],
      liveMatch: null
    });
  };

  const createPlayer = (username: string, password?: string) => {
    const newUser: User = { id: 'P' + Math.random().toString(36).substr(2, 5), username, password: password || '123', role: Role.PLAYER };
    updateState({
      users: [...state.users, newUser],
      playersStats: { ...state.playersStats, [newUser.id]: getInitialStats(newUser.id) },
      commonStats: { ...state.commonStats, [newUser.id]: getInitialStats(newUser.id) }
    });
  };

  const updateUser = (id: string, username: string, password: string) => {
    updateState({
      users: state.users.map(u => u.id === id ? { ...u, username, password } : u)
    });
  };

  const deleteUser = (id: string) => {
    const ns = { ...state.playersStats }; delete ns[id];
    const ncs = { ...state.commonStats }; delete ncs[id];
    updateState({ users: state.users.filter(u => u.id !== id), playersStats: ns, commonStats: ncs });
  };

  return { state, login, logout: () => updateState({ currentUser: null }), createPlayer, updateUser, deleteUser, calculateAndSaveStats, updateState };
};

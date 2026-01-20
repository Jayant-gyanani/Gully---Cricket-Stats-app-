
import React, { useState } from 'react';
import { AppState, Role, PlayerStats } from '../types';
import OverVisual from './OverVisual';

interface PlayerDashboardProps {
  state: AppState;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ state }) => {
  const [view, setView] = useState<'HOME' | 'PERSONAL' | 'LEADERBOARD' | 'LIVE'>('HOME');
  const [subTab, setSubTab] = useState<'BATTING' | 'BOWLING' | 'COMMON'>('BATTING');
  const [commonType, setCommonType] = useState<'BATTING' | 'BOWLING'>('BATTING');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const me = state.currentUser!;
  const myMatches = state.history.filter(m => 
    m.teamA.players.includes(me.id) || 
    m.teamB.players.includes(me.id) || 
    m.commons.includes(me.id)
  ).length;

  const emptyStats: PlayerStats = { 
    id: me.id, innings: 0, matches: 0, runs: 0, highestScore: 0, balls: 0, 
    fours: 0, sixes: 0, twos: 0, ones: 0, dots: 0, 
    wideFaced: 0, nbFaced: 0, outs: 0, ducks: 0,
    wickets: 0, oversBowled: 0, runsConceded: 0, 
    maidens: 0, maxRunsInOver: 0, 
    foursConceded: 0, sixesConceded: 0, twosConceded: 0, onesConceded: 0,
    dotsBowled: 0, wideBowled: 0, nbBowled: 0 
  };

  const liveMatch = state.liveMatch;

  const StatBox = ({ label, value, sub }: { label: string, value: any, sub?: string }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  const renderPersonalStats = () => {
    const stats = subTab === 'COMMON' ? (state.commonStats[me.id] || emptyStats) : (state.playersStats[me.id] || emptyStats);
    const isBatting = (subTab === 'BATTING') || (subTab === 'COMMON' && commonType === 'BATTING');

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setView('HOME')} className="p-2 bg-slate-100 rounded-lg text-xs font-bold">← BACK</button>
          <h2 className="text-xl font-bold">Personal Stats</h2>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {['BATTING', 'BOWLING', 'COMMON'].map(t => (
            <button key={t} onClick={() => setSubTab(t as any)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${subTab === t ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>

        {subTab === 'COMMON' && (
          <div className="flex bg-blue-50/50 p-1 rounded-xl gap-1 mx-4">
            <button onClick={() => setCommonType('BATTING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${commonType === 'BATTING' ? 'bg-blue-600 text-white shadow' : 'text-blue-400'}`}>BATTING STATS</button>
            <button onClick={() => setCommonType('BOWLING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${commonType === 'BOWLING' ? 'bg-blue-600 text-white shadow' : 'text-blue-400'}`}>BOWLING STATS</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {isBatting ? (
            <>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <StatBox label="Total Runs" value={stats.runs} />
                <StatBox label="High Score" value={stats.highestScore} />
              </div>
              <StatBox label="Balls Faced" value={stats.balls} />
              <StatBox label="Strike Rate" value={stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0'} />
              <StatBox label="Dot Balls" value={stats.dots} />
              <StatBox label="Extras Faced" value={stats.wideFaced + stats.nbFaced} sub={`WD: ${stats.wideFaced}, NB: ${stats.nbFaced}`} />
              <StatBox label="6s / 4s" value={`${stats.sixes} / ${stats.fours}`} />
              <StatBox label="2s / 1s" value={`${stats.twos} / ${stats.ones}`} />
              <StatBox label="Ducks" value={stats.ducks} />
              <StatBox label="Average" value={stats.outs > 0 ? (stats.runs / stats.outs).toFixed(1) : stats.runs.toFixed(1)} />
            </>
          ) : (
            <>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <StatBox label="Wickets" value={stats.wickets} />
                <StatBox label="Maidens" value={stats.maidens} />
              </div>
              <StatBox label="Overs" value={stats.oversBowled} />
              <StatBox label="Runs Conc." value={stats.runsConceded} />
              <StatBox label="Economy" value={stats.oversBowled > 0 ? (stats.runsConceded / stats.oversBowled).toFixed(2) : '0.00'} />
              <StatBox label="Max Runs/Over" value={stats.maxRunsInOver} />
              <StatBox label="6s / 4s Conc." value={`${stats.sixesConceded} / ${stats.foursConceded}`} />
              <StatBox label="Dots Bowled" value={stats.dotsBowled} />
              <StatBox label="Wide / NB" value={`${stats.wideBowled} / ${stats.nbBowled}`} />
              <StatBox label="2s / 1s Conc." value={`${stats.twosConceded} / ${stats.onesConceded}`} />
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const isBatting = (subTab === 'BATTING') || (subTab === 'COMMON' && commonType === 'BATTING');
    
    const metrics = isBatting ? [
      { id: 'runs', label: 'Total Runs Scored' },
      { id: 'highestScore', label: 'Highest Score' },
      { id: 'balls', label: 'Total Balls Faced' },
      { id: 'strikeRate', label: 'Best Strike Rate' },
      { id: 'sixes', label: 'Most Sixes' },
      { id: 'fours', label: 'Most Fours' },
      { id: 'dots', label: 'Most Dot Balls Faced' },
      { id: 'ducks', label: 'Most Ducks (0 Outs)' }
    ] : [
      { id: 'wickets', label: 'Total Wickets Taken' },
      { id: 'maidens', label: 'Most Maiden Overs' },
      { id: 'economy', label: 'Best Economy Rate' },
      { id: 'oversBowled', label: 'Total Overs Bowled' },
      { id: 'runsConceded', label: 'Total Runs Conceded' },
      { id: 'maxRunsInOver', label: 'Lowest Max Runs/Over' },
      { id: 'dotsBowled', label: 'Most Dot Balls Bowled' }
    ];

    if (!selectedMetric) {
      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setView('HOME')} className="p-2 bg-slate-100 rounded-lg text-xs font-bold">← BACK</button>
            <h2 className="text-xl font-bold">Leaderboard</h2>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button onClick={() => { setSubTab('BATTING'); setCommonType('BATTING'); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${subTab === 'BATTING' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>BATTING TABLES</button>
            <button onClick={() => { setSubTab('BOWLING'); setCommonType('BATTING'); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${subTab === 'BOWLING' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>BOWLING TABLES</button>
            <button onClick={() => setSubTab('COMMON')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${subTab === 'COMMON' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>COMMON TABLES</button>
          </div>

          {subTab === 'COMMON' && (
            <div className="flex bg-purple-50/50 p-1 rounded-xl gap-1 mx-4">
              <button onClick={() => setCommonType('BATTING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${commonType === 'BATTING' ? 'bg-purple-600 text-white shadow' : 'text-purple-400'}`}>BATTING</button>
              <button onClick={() => setCommonType('BOWLING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${commonType === 'BOWLING' ? 'bg-purple-600 text-white shadow' : 'text-purple-400'}`}>BOWLING</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 mt-4">
            {metrics.map(m => (
              <button key={m.id} onClick={() => setSelectedMetric(m.id)} className="w-full text-left p-4 bg-white border rounded-2xl flex justify-between items-center group active:bg-slate-50">
                <span className="font-bold text-slate-700">{m.label}</span>
                <span className="text-slate-300 group-hover:text-blue-600">→</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Show actual ranking for the metric
    const players = state.users.filter(u => u.role === Role.PLAYER);
    const sorted = [...players].sort((a, b) => {
      const sA = subTab === 'COMMON' ? state.commonStats[a.id] : state.playersStats[a.id];
      const sB = subTab === 'COMMON' ? state.commonStats[b.id] : state.playersStats[b.id];
      
      const getVal = (s: PlayerStats) => {
        if (!s) return 0;
        if (selectedMetric === 'strikeRate') return s.balls > 0 ? (s.runs / s.balls) * 100 : 0;
        if (selectedMetric === 'economy') return s.oversBowled > 0 ? (s.runsConceded / s.oversBowled) : 999;
        if (selectedMetric === 'maxRunsInOver' && !isBatting) return s.maxRunsInOver || 999;
        return (s as any)[selectedMetric!] || 0;
      };

      const valA = getVal(sA);
      const valB = getVal(sB);

      // Descending for most metrics, ascending for economy/maxRunsInOver
      if (selectedMetric === 'economy' || selectedMetric === 'maxRunsInOver') return valA - valB;
      return valB - valA;
    });

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedMetric(null)} className="p-2 bg-slate-100 rounded-lg text-xs font-bold">← BACK</button>
          <h2 className="text-lg font-bold leading-tight">{metrics.find(m => m.id === selectedMetric)?.label}</h2>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          {sorted.map((p, i) => {
            const s = subTab === 'COMMON' ? state.commonStats[p.id] : state.playersStats[p.id];
            let displayVal = '0';
            if (s) {
              if (selectedMetric === 'strikeRate') displayVal = ((s.runs / s.balls) * 100 || 0).toFixed(1);
              else if (selectedMetric === 'economy') displayVal = (s.runsConceded / s.oversBowled || 0).toFixed(2);
              else displayVal = (s as any)[selectedMetric!]?.toString() || '0';
            }

            return (
              <div key={p.id} className="flex justify-between p-4 border-b last:border-0 items-center">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <span className="font-bold text-sm">{p.username}</span>
                </div>
                <span className="text-blue-600 font-black text-lg">{displayVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLiveMatch = () => {
    const inn = liveMatch?.innings[liveMatch.innings.length - 1];
    const ov = inn?.overs[inn.currentOverIndex];
    const lastBall = ov?.balls[ov.balls.length - 1];
    const batsman = lastBall ? (lastBall.batsmanId.startsWith('OTHER') ? lastBall.batsmanId : state.users.find(u => u.id === lastBall.batsmanId)?.username) : '---';
    const bowler = lastBall ? (lastBall.bowlerId.startsWith('OTHER') ? lastBall.bowlerId : state.users.find(u => u.id === lastBall.bowlerId)?.username) : '---';

    const myTeam = liveMatch?.teamA.players.includes(me.id) ? 'A' : liveMatch?.teamB.players.includes(me.id) ? 'B' : liveMatch?.commons.includes(me.id) ? 'COMMON' : 'NONE';
    const isBatting = (myTeam === 'A' && inn?.battingTeamId === 'A') || (myTeam === 'B' && inn?.battingTeamId === 'B');
    
    let containerClass = "bg-slate-50";
    if (liveMatch?.status === 'FINISHED') {
      if (myTeam === 'COMMON') containerClass = "bg-slate-200";
      else if (myTeam === liveMatch.winner) containerClass = "bg-green-100";
      else if (liveMatch.winner === 'DRAW') containerClass = "bg-slate-300";
      else if (myTeam !== 'NONE') containerClass = "bg-red-100";
    }

    return (
      <div className={`-m-4 p-4 min-h-screen ${containerClass} transition-colors`}>
        <button onClick={() => setView('HOME')} className="text-blue-600 font-bold mb-4 flex items-center gap-2">
          <span className="p-1 bg-white rounded shadow-sm">←</span> 
          <span>Back to Home</span>
        </button>
        {liveMatch ? (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border shadow-sm text-center">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">TEAM {myTeam}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isBatting ? 'BATTING' : 'FIELDING'}</span>
               </div>
               <h2 className="text-5xl font-black mb-1">{inn?.score}/{inn?.wickets}</h2>
               <p className="text-slate-400 text-xs font-bold">Overs: {inn?.currentOverIndex}.{ov?.balls.filter(b=>b.type!=='WIDE'&&b.type!=='NB').length}</p>
               {liveMatch.innings.length === 2 && <p className="text-sm font-bold text-purple-600 mt-3 bg-purple-50 py-1 rounded-full">Target: {liveMatch.innings[0].score + 1}</p>}
               <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                 <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase">Striker</p><p className="font-bold text-sm text-slate-800">{batsman}</p></div>
                 <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">Bowler</p><p className="font-bold text-sm text-slate-800">{bowler}</p></div>
               </div>
            </div>
            {ov && <OverVisual balls={ov.balls} isDark={false} />}
          </div>
        ) : <div className="text-center py-24 text-slate-300 font-bold">No Match Active Right Now</div>}
      </div>
    );
  };

  if (view === 'PERSONAL') return renderPersonalStats();
  if (view === 'LEADERBOARD') return renderLeaderboard();
  if (view === 'LIVE') return renderLiveMatch();

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="text-8xl">🏏</span>
        </div>
        <div className="relative z-10">
          <p className="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mb-1">Welcome back,</p>
          <h2 className="text-3xl font-black uppercase leading-none">{me.username}</h2>
          <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
            <span className="text-[10px] font-bold uppercase tracking-widest">Matches Played:</span>
            <span className="font-black">{myMatches}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Sequence: 1. Personal Stats, 2. Leaderboard, 3. Live Match */}
        <button 
          onClick={() => { setView('PERSONAL'); setSubTab('BATTING'); }}
          className="bg-white p-6 rounded-3xl border flex items-center justify-between group active:scale-95 transition-all shadow-sm"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">📊</div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800">Personal Stats</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batting & Bowling History</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-blue-600 transition-colors">→</span>
        </button>

        <button 
          onClick={() => { setView('LEADERBOARD'); setSubTab('BATTING'); setSelectedMetric(null); }}
          className="bg-white p-6 rounded-3xl border flex items-center justify-between group active:scale-95 transition-all shadow-sm"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800">Leaderboard</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rankings by Metric</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-amber-600 transition-colors">→</span>
        </button>

        <button 
          onClick={() => setView('LIVE')}
          className={`p-6 rounded-3xl border-2 text-left flex items-center justify-between transition-all active:scale-95 ${liveMatch ? 'border-green-400 bg-green-50 shadow-green-100 shadow-xl' : 'bg-white border-slate-100 opacity-80'}`}
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">📡</div>
            <div>
              <h3 className="font-bold text-slate-800">Live Match</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{liveMatch ? 'Action in progress' : 'Waiting for toss'}</p>
            </div>
          </div>
          {liveMatch && (
            <div className="flex items-center gap-2 bg-red-500 px-2 py-1 rounded-lg text-white">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase">Live</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlayerDashboard;

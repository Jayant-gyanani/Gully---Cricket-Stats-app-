
import React, { useState } from 'react';
import { AppState, Match, BallRecord, Inning } from '../types';
import OverVisual from './OverVisual';

interface UmpireDashboardProps {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
}

const UmpireDashboard: React.FC<UmpireDashboardProps> = ({ state, updateState }) => {
  const match = state.liveMatch;
  const [selectedBatsman, setSelectedBatsman] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');
  const [nbModal, setNbModal] = useState(false);
  const [tieModal, setTieModal] = useState(false);
  const [inningEndModal, setInningEndModal] = useState(false);

  if (!match) return <div className="py-20 text-center text-slate-400">No live match active.</div>;

  const currentInningIndex = match.innings.length - 1;
  const inning = match.innings[currentInningIndex];
  const battingTeam = inning.battingTeamId === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = inning.battingTeamId === 'A' ? match.teamB : match.teamA;
  const currentOver = inning.overs[inning.currentOverIndex];

  // FIX: Only use players already assigned to teams/commons to avoid duplicates
  const allPossibleBatsmen = [...battingTeam.players, ...match.commons];
  const playersInInning = allPossibleBatsmen.filter(id => !inning.dismissedPlayerIds.includes(id));
    
  const prevOver = inning.currentOverIndex > 0 ? inning.overs[inning.currentOverIndex - 1] : null;
  const lastBowlerId = prevOver?.bowlerId || '';
  
  const availableBowlers = [...bowlingTeam.players, ...match.commons]
    .filter(id => id !== lastBowlerId);

  const startSecondInning = () => {
    const nm = JSON.parse(JSON.stringify(match)) as Match;
    const curInn = nm.innings[0];
    nm.innings.push({ 
      battingTeamId: curInn.battingTeamId === 'A' ? 'B' : 'A', 
      score: 0, wickets: 0, currentOverIndex: 0, allOut: false, dismissedPlayerIds: [],
      overs: [{ balls: [], bowlerId: '', isCompleted: false }] 
    });
    setInningEndModal(false);
    setSelectedBatsman('');
    setSelectedBowler('');
    updateState({ liveMatch: nm });
  };

  const handleBall = (type: BallRecord['type'], runs: number = 0, nbValue?: string) => {
    if (match.status === 'FINISHED' || inningEndModal) return;
    if (!selectedBatsman || !selectedBowler) { alert('Select Batsman and Bowler!'); return; }

    const nm = JSON.parse(JSON.stringify(match)) as Match;
    const curInn = nm.innings[nm.innings.length - 1];
    const curOv = curInn.overs[curInn.currentOverIndex];

    curOv.bowlerId = selectedBowler;
    const newBall: BallRecord = { batsmanId: selectedBatsman, bowlerId: selectedBowler, type, runs, nbValue };
    curOv.balls.push(newBall);
    
    // FIX: No bonus runs for extras. Only runs completed by batsman are added.
    curInn.score += runs;
    
    if (type === 'OUT') {
      curInn.wickets += 1;
      curInn.dismissedPlayerIds.push(selectedBatsman);
      setSelectedBatsman('');
    }

    const legalBalls = curOv.balls.filter(b => b.type !== 'WIDE' && b.type !== 'NB').length;
    if (legalBalls === 6) {
      curOv.isCompleted = true;
      if (curInn.currentOverIndex < match.maxOvers - 1) {
        curInn.currentOverIndex += 1;
        curInn.overs.push({ balls: [], bowlerId: '', isCompleted: false });
        setSelectedBowler('');
      } else { 
        curInn.allOut = true; 
      }
    }

    if (nm.innings.length === 2) {
      const target = nm.innings[0].score + 1;
      if (curInn.score >= target) { 
        nm.status = 'FINISHED'; 
        nm.winner = curInn.battingTeamId; 
      }
    }

    const totalBatsmenCount = allPossibleBatsmen.length;
    if (curInn.wickets >= totalBatsmenCount || curInn.allOut) {
      if (nm.innings.length === 1) {
        setInningEndModal(true); // Show confirmation before 2nd inning
      } else {
        const target = nm.innings[0].score + 1;
        if (curInn.score >= target) { 
          nm.status = 'FINISHED'; 
          nm.winner = curInn.battingTeamId; 
        } else if (curInn.score === target - 1) {
          setTieModal(true);
        } else { 
          nm.status = 'FINISHED'; 
          nm.winner = curInn.battingTeamId === 'A' ? 'B' : 'A'; 
        }
      }
    }
    updateState({ liveMatch: nm });
  };

  const startSuperOver = () => {
    const nm = JSON.parse(JSON.stringify(match)) as Match;
    // Reset for 1-over shootout
    nm.maxOvers = 1;
    nm.status = 'LIVE';
    nm.winner = undefined;
    nm.innings = [{ 
      battingTeamId: nm.toss.winnerId === 'A' ? (nm.toss.choice === 'BAT' ? 'A' : 'B') : (nm.toss.choice === 'BAT' ? 'B' : 'A'),
      score: 0, wickets: 0, currentOverIndex: 0, allOut: false, dismissedPlayerIds: [],
      overs: [{ balls: [], bowlerId: '', isCompleted: false }] 
    }];
    setTieModal(false);
    setSelectedBatsman('');
    setSelectedBowler('');
    updateState({ liveMatch: nm });
  };

  const undo = () => {
    const nm = JSON.parse(JSON.stringify(match)) as Match;
    const inn = nm.innings[nm.innings.length - 1];
    let ov = inn.overs[inn.currentOverIndex];
    
    if (ov.balls.length === 0 && inn.currentOverIndex > 0) { 
      inn.currentOverIndex--; 
      inn.overs.pop(); 
      ov = inn.overs[inn.currentOverIndex]; 
    }
    
    if (ov.balls.length > 0) { 
      const b = ov.balls.pop()!; 
      inn.score -= b.runs; 
      if (b.type === 'OUT') {
        inn.wickets--; 
        inn.dismissedPlayerIds = inn.dismissedPlayerIds.filter((id: string) => id !== b.batsmanId);
      }
      updateState({ liveMatch: nm }); 
      setInningEndModal(false); // Hide end modal if undoing
    }
  };

  const handleManualEndInning = () => {
    const nm = JSON.parse(JSON.stringify(match)) as Match;
    const curInnIndex = nm.innings.length - 1;
    const curInn = nm.innings[curInnIndex];
    curInn.allOut = true;

    if (curInnIndex === 0) {
      // First Inning manual end
      setInningEndModal(true);
      updateState({ liveMatch: nm });
    } else {
      // Second Inning manual end
      const target = nm.innings[0].score + 1;
      if (curInn.score === target - 1) {
        setTieModal(true);
        updateState({ liveMatch: nm });
      } else {
        nm.status = 'FINISHED';
        if (curInn.score >= target) {
          nm.winner = curInn.battingTeamId;
        } else {
          // Team who batted 1st wins
          nm.winner = nm.innings[0].battingTeamId;
        }
        updateState({ liveMatch: nm });
      }
    }
  };

  const bgClass = currentInningIndex === 0 ? 'bg-orange-50' : 'bg-purple-50';
  const target = currentInningIndex === 1 ? match.innings[0].score + 1 : null;

  return (
    <div className="relative">
      <div className={`-m-4 p-4 min-h-screen ${bgClass} transition-colors duration-500`}>
        <div className="bg-white p-4 rounded-3xl shadow-sm border text-center mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {currentInningIndex + 1}st INNING | {battingTeam.captainId || (inning.battingTeamId === 'A' ? 'TEAM A' : 'TEAM B')} vs {bowlingTeam.captainId || (inning.battingTeamId === 'A' ? 'TEAM B' : 'TEAM A')}
          </h2>
          <p className="text-4xl font-black">{inning.score}/{inning.wickets} <span className="text-sm font-normal text-slate-400">({inning.currentOverIndex}.{currentOver.balls.filter(b => b.type !== 'WIDE' && b.type !== 'NB').length})</span></p>
          {target && <p className="text-xs font-bold text-purple-600 mt-1">Target: {target}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <select className="p-3 border rounded-xl text-xs font-bold bg-white" value={selectedBatsman} onChange={e => setSelectedBatsman(e.target.value)}>
            <option value="">Batsman</option>
            {playersInInning.map(id => <option key={id} value={id}>{id.startsWith('OTHER') ? id : state.users.find(u => u.id === id)?.username}</option>)}
          </select>
          <select className="p-3 border rounded-xl text-xs font-bold bg-white" value={selectedBowler} onChange={e => setSelectedBowler(e.target.value)}>
            <option value="">Bowler</option>
            {availableBowlers.map(id => <option key={id} value={id}>{id.startsWith('OTHER') ? id : state.users.find(u => u.id === id)?.username}</option>)}
          </select>
        </div>

        <OverVisual balls={currentOver.balls} />

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[0, 1, 2, 'W', 4, 6, 'WD', 'NB'].map(v => (
            <button key={v} onClick={() => v === 'W' ? handleBall('OUT') : v === 'WD' ? handleBall('WIDE') : v === 'NB' ? setNbModal(true) : handleBall('RUNS', v as number)}
              className="aspect-square bg-white border-2 rounded-2xl font-black text-xl shadow-sm active:scale-90 transition-transform disabled:opacity-30"
              disabled={match.status === 'FINISHED' || inningEndModal}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={undo} className="flex-1 bg-white border py-3 rounded-xl text-xs font-bold">UNDO</button>
          <button onClick={handleManualEndInning} className="flex-1 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold uppercase">End Inning</button>
        </div>
      </div>

      {match.status === 'FINISHED' && (
        <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-6 text-center text-white rounded-3xl mt-12 mb-20 mx-4">
          <div className="animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-2 tracking-tighter">MATCH FINISHED!</h2>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 mb-6">
              <p className="text-xs uppercase font-bold opacity-60 mb-1">Winner</p>
              <p className="text-2xl font-black">{match.winner === 'DRAW' ? 'MATCH DRAW' : `TEAM ${match.winner}`}</p>
            </div>
            <p className="text-xs opacity-60">The score is locked. Waiting for Admin to save stats.</p>
          </div>
        </div>
      )}

      {inningEndModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-3xl space-y-6 text-center">
            <h3 className="text-2xl font-black text-slate-900 leading-tight">1st Inning Ended</h3>
            <p className="text-sm text-slate-500 font-medium">Ready to start the 2nd inning?</p>
            <div className="flex flex-col gap-2">
              <button onClick={startSecondInning} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-100">OK, START 2ND INNING</button>
              <button onClick={undo} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase">Undo Last Ball</button>
            </div>
          </div>
        </div>
      )}

      {nbModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-6 rounded-3xl space-y-3">
            <h3 className="font-bold text-center">No Ball Outcome</h3>
            <div className="grid grid-cols-3 gap-2">
              {[0,1,2,4,6].map(r => <button key={r} onClick={() => { handleBall('NB', r); setNbModal(false); }} className="p-4 border rounded-xl font-bold bg-slate-50">{r}</button>)}
              <button onClick={() => { handleBall('NB', 0, 'OUT'); setNbModal(false); }} className="p-4 border rounded-xl font-bold bg-red-50 text-red-600">OUT</button>
              <button onClick={() => { handleBall('NB', 0, 'WD'); setNbModal(false); }} className="p-4 border rounded-xl font-bold bg-amber-50 text-amber-600">WD</button>
            </div>
            <button onClick={() => setNbModal(false)} className="w-full py-2 text-slate-400 font-bold">CANCEL</button>
          </div>
        </div>
      )}

      {tieModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-6 rounded-3xl space-y-4 text-center">
            <h3 className="font-bold text-lg">It's a Tie!</h3>
            <button onClick={() => { const nm = {...match}; nm.status='FINISHED'; nm.winner='DRAW'; updateState({liveMatch: nm}); setTieModal(false); }} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold">DECLARE DRAW</button>
            <button onClick={startSuperOver} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">START SUPER OVER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmpireDashboard;

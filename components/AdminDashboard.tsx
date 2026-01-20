
import React, { useState } from 'react';
import { AppState, Match, Role, User, Inning } from '../types';

interface AdminDashboardProps {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  createPlayer: (name: string, password?: string) => void;
  updateUser?: (id: string, name: string, pass: string) => void;
  deleteUser?: (id: string) => void;
  calculateAndSaveStats: (m: Match) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ state, updateState, createPlayer, updateUser, deleteUser, calculateAndSaveStats }) => {
  const [view, setView] = useState<'HOME' | 'SETUP' | 'PLAYERS' | 'LIVE_EDIT'>('HOME');
  
  // Modals for Players Tab
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPass, setFormPass] = useState('123');

  // Setup state
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [commons, setCommons] = useState<string[]>([]);
  const [others, setOthers] = useState(0);
  const [overs, setOvers] = useState(5);
  const [captainA, setCaptainA] = useState('');
  const [captainB, setCaptainB] = useState('');
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossChoice, setTossChoice] = useState<'BAT' | 'BOWL'>('BAT');

  const players = state.users.filter(u => u.role === Role.PLAYER);

  const startMatch = () => {
    const startInning: Inning = {
      battingTeamId: tossWinner === 'A' ? (tossChoice === 'BAT' ? 'A' : 'B') : (tossChoice === 'BAT' ? 'B' : 'A'),
      score: 0, wickets: 0, currentOverIndex: 0, allOut: false, dismissedPlayerIds: [],
      overs: [{ balls: [], bowlerId: '', isCompleted: false }]
    };
    const newMatch: Match = {
      id: Date.now().toString(), date: new Date().toLocaleDateString(), maxOvers: overs,
      teamA: { captainId: captainA, players: teamA }, teamB: { captainId: captainB, players: teamB },
      commons, others, toss: { winnerId: tossWinner, choice: tossChoice },
      innings: [startInning], status: 'LIVE'
    };
    updateState({ liveMatch: newMatch });
    setView('HOME');
  };

  const otherOptions = Array.from({ length: others }, (_, i) => `OTHER_${i + 1}`);

  if (view === 'SETUP') {
    const pool = [...selectedPlayers, ...otherOptions];

    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="p-2 bg-slate-100 rounded-lg">←</button>
          <h2 className="text-xl font-bold">Match Setup</h2>
        </div>
        
        <section className="bg-white p-4 rounded-xl border">
          <label className="block text-sm font-bold mb-2">1. Select Players Present</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {players.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={selectedPlayers.includes(p.id)} onChange={() => setSelectedPlayers(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                {p.username}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <label className="text-xs font-bold">Other Players (0-10)</label>
            <input type="number" className="w-16 border rounded p-1 text-center" value={others} onChange={e => setOthers(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 border rounded-xl">
            <h3 className="text-xs font-bold text-blue-600 mb-2">Team A</h3>
            <div className="space-y-1">
              {pool.map(id => (
                <button key={id} onClick={() => { setTeamA(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setTeamB(teamB.filter(x => x !== id)); setCommons(commons.filter(x => x !== id)); }}
                  className={`text-[10px] w-full p-1 rounded border ${teamA.includes(id) ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>
                  {id.startsWith('OTHER') ? id : players.find(p => p.id === id)?.username}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white p-3 border rounded-xl">
            <h3 className="text-xs font-bold text-orange-600 mb-2">Team B</h3>
            <div className="space-y-1">
              {pool.map(id => (
                <button key={id} onClick={() => { setTeamB(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setTeamA(teamA.filter(x => x !== id)); setCommons(commons.filter(x => x !== id)); }}
                  className={`text-[10px] w-full p-1 rounded border ${teamB.includes(id) ? 'bg-orange-600 text-white' : 'bg-slate-50'}`}>
                  {id.startsWith('OTHER') ? id : players.find(p => p.id === id)?.username}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white p-4 border rounded-xl">
          <h3 className="text-xs font-bold mb-2">Common Players</h3>
          <div className="flex flex-wrap gap-2">
            {pool.filter(id => !teamA.includes(id) && !teamB.includes(id)).map(id => (
              <button key={id} onClick={() => setCommons(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev)}
                className={`text-[10px] p-2 border rounded ${commons.includes(id) ? 'bg-purple-600 text-white' : 'bg-slate-50'}`}>
                {id.startsWith('OTHER') ? id : players.find(p => p.id === id)?.username}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-800 text-white p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] uppercase font-bold opacity-50">Toss Winner</label>
              <select className="w-full bg-slate-700 p-2 rounded text-xs font-bold" value={tossWinner} onChange={e => setTossWinner(e.target.value as any)}>
                <option value="A">Team A</option><option value="B">Team B</option>
              </select>
            </div>
            <div><label className="text-[10px] uppercase font-bold opacity-50">Choice</label>
              <select className="w-full bg-slate-700 p-2 rounded text-xs font-bold" value={tossChoice} onChange={e => setTossChoice(e.target.value as any)}>
                <option value="BAT">Batting</option><option value="BOWL">Bowling</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold">Match Overs (1-30)</label>
            <input type="number" className="w-16 bg-slate-700 p-1 text-center rounded font-bold" value={overs} onChange={e => setOvers(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))} />
          </div>
        </section>

        <button onClick={startMatch} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">START MATCH LIVE</button>
      </div>
    );
  }

  if (view === 'PLAYERS') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="p-2 bg-slate-100 rounded-lg">←</button>
          <h2 className="text-xl font-bold">Player Management</h2>
        </div>

        <button 
          onClick={() => { setFormName(''); setFormPass('123'); setShowAddModal(true); }}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-sm"
        >
          Add New Player
        </button>

        <div className="space-y-2 mt-4">
          {players.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-white border rounded-xl shadow-sm">
              <div className="flex flex-col">
                <span className="font-bold">{p.username}</span>
                <span className="text-[10px] text-slate-400">ID: {p.id}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setTargetUser(p); setFormName(p.username); setFormPass(p.password || ''); setShowEditModal(true); }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => { setTargetUser(p); setShowDeleteModal(true); }}
                  className="p-2 bg-red-50 text-red-600 rounded-lg"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Player Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold">New Player</h3>
              <input className="w-full p-3 border rounded-xl" placeholder="Name" value={formName} onChange={e => setFormName(e.target.value)} />
              <input className="w-full p-3 border rounded-xl" placeholder="Password" value={formPass} onChange={e => setFormPass(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                <button onClick={() => { createPlayer(formName, formPass); setShowAddModal(false); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Add Player</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Player Modal */}
        {showEditModal && targetUser && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold">Edit Player</h3>
              <input className="w-full p-3 border rounded-xl" value={formName} onChange={e => setFormName(e.target.value)} />
              <input className="w-full p-3 border rounded-xl" value={formPass} onChange={e => setFormPass(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                <button onClick={() => { updateUser?.(targetUser.id, formName, formPass); setShowEditModal(false); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Player Modal */}
        {showDeleteModal && targetUser && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-3xl space-y-4 text-center">
              <h3 className="text-lg font-bold">Confirm Delete</h3>
              <p className="text-sm text-slate-500">Are you sure you want to delete the player <b>{targetUser.username}</b>?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                <button onClick={() => { deleteUser?.(targetUser.id); setShowDeleteModal(false); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setView('SETUP')} className="bg-white p-6 rounded-2xl border flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm">
          <span className="text-3xl">🏏</span>
          <span className="font-bold">New Match</span>
        </button>
        <button onClick={() => setView('PLAYERS')} className="bg-white p-6 rounded-2xl border flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm">
          <span className="text-3xl">👥</span>
          <span className="font-bold">Players</span>
        </button>
      </div>

      {state.liveMatch && (
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <h3 className="font-bold text-blue-900">Live Match Active</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setView('LIVE_EDIT')} className="bg-white border border-blue-200 py-3 rounded-xl font-bold text-blue-700 active:scale-95 transition-all">EDIT SCORES & PLAYERS</button>
            {state.liveMatch.status === 'FINISHED' && (
              <button onClick={() => calculateAndSaveStats(state.liveMatch!)} className="bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg">SAVE & END MATCH PERMANENTLY</button>
            )}
            <button onClick={() => updateState({ liveMatch: null })} className="text-red-600 text-xs font-bold py-2">CANCEL WITHOUT SAVING</button>
          </div>
        </div>
      )}

      {view === 'LIVE_EDIT' && state.liveMatch && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] p-4 flex flex-col">
          <div className="bg-white rounded-3xl p-6 flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Correction Center</h2>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div><label className="text-[10px] font-bold">Score</label><input type="number" className="w-full border p-2 rounded font-bold" value={state.liveMatch.innings[state.liveMatch.innings.length-1].score} onChange={e => { const nm = {...state.liveMatch!}; nm.innings[nm.innings.length-1].score = parseInt(e.target.value); updateState({liveMatch: nm}); }} /></div>
              <div><label className="text-[10px] font-bold">Wkts</label><input type="number" className="w-full border p-2 rounded font-bold" value={state.liveMatch.innings[state.liveMatch.innings.length-1].wickets} onChange={e => { const nm = {...state.liveMatch!}; nm.innings[nm.innings.length-1].wickets = parseInt(e.target.value); updateState({liveMatch: nm}); }} /></div>
              <div><label className="text-[10px] font-bold">Over</label><input type="number" className="w-full border p-2 rounded font-bold" value={state.liveMatch.innings[state.liveMatch.innings.length-1].currentOverIndex} onChange={e => { const nm = {...state.liveMatch!}; nm.innings[nm.innings.length-1].currentOverIndex = parseInt(e.target.value); updateState({liveMatch: nm}); }} /></div>
            </div>
            
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 border-t pt-4">
              <span>Toggle Player OUT / NOT OUT</span>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 rounded">BATTING SIDE</span>
            </h3>
            
            <div className="space-y-2">
              {(state.liveMatch.innings[state.liveMatch.innings.length-1].battingTeamId === 'A' 
                ? [...state.liveMatch.teamA.players, ...state.liveMatch.commons, ...otherOptions.filter(o => state.liveMatch!.teamA.players.includes(o) || (!state.liveMatch!.teamA.players.includes(o) && !state.liveMatch!.teamB.players.includes(o)))] 
                : [...state.liveMatch.teamB.players, ...state.liveMatch.commons, ...otherOptions.filter(o => state.liveMatch!.teamB.players.includes(o))])
                .map(pid => {
                  const name = pid.startsWith('OTHER') ? pid : state.users.find(u => u.id === pid)?.username;
                  const isOut = state.liveMatch!.innings[state.liveMatch!.innings.length-1].dismissedPlayerIds.includes(pid);
                  
                  return (
                    <div key={pid} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl">
                      <span className={`text-xs font-bold ${isOut ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{name}</span>
                      <button 
                        onClick={() => {
                          const nm = JSON.parse(JSON.stringify(state.liveMatch));
                          const curInn = nm.innings[nm.innings.length - 1];
                          if (isOut) {
                            curInn.dismissedPlayerIds = curInn.dismissedPlayerIds.filter((id: string) => id !== pid);
                            curInn.wickets = Math.max(0, curInn.wickets - 1);
                          } else {
                            curInn.dismissedPlayerIds.push(pid);
                            curInn.wickets += 1;
                          }
                          updateState({ liveMatch: nm });
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${isOut ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                      >
                        {isOut ? 'OUT' : 'NOT OUT'}
                      </button>
                    </div>
                  );
              })}
            </div>
            
            <button onClick={() => setView('HOME')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mt-8 shadow-lg">CLOSE EDITOR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

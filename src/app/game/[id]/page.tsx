'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: number;
  name: string;
  final_score: number;
}

interface Round {
  id: number;
  round_number: number;
  dealer_name: string;
  winner_name?: string;
  loser_name?: string;
  hand_type?: string;
  points: number;
}

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showAddRound, setShowAddRound] = useState(false);
  const [newRound, setNewRound] = useState({
    dealer_id: '',
    winner_id: '',
    loser_id: '',
    hand_type: '',
    points: ''
  });

  useEffect(() => {
    fetchGame();
    fetchRounds();
  }, [gameId]);

  async function fetchGame() {
    const res = await fetch('/api/games');
    if (res.ok) {
      const games = await res.json();
      const g = games.find((ga: any) => ga.id === parseInt(gameId));
      setGame(g);
      if (g?.players) setPlayers(g.players);
    }
  }

  async function fetchRounds() {
    const res = await fetch(`/api/games/${gameId}/rounds`);
    if (res.ok) setRounds(await res.json());
  }

  async function addRound(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRound,
        dealer_id: parseInt(newRound.dealer_id),
        winner_id: newRound.winner_id ? parseInt(newRound.winner_id) : null,
        loser_id: newRound.loser_id ? parseInt(newRound.loser_id) : null,
        points: parseInt(newRound.points) || 0
      })
    });
    if (res.ok) {
      setNewRound({ dealer_id: '', winner_id: '', loser_id: '', hand_type: '', points: '' });
      setShowAddRound(false);
      fetchRounds();
      fetchGame();
    }
  }

  if (!game) return <div className="p-8">Loading...</div>;

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <Link href="/" className="text-blue-600 hover:underline mb-4 block">← Back to Games</Link>
      
      <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
      <p className={`text-sm mb-6 ${game.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
        {game.status}
      </p>

      {/* Scoreboard */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Scoreboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {players.map(p => (
            <div key={p.id} className="text-center p-4 bg-gray-50 rounded">
              <p className="font-semibold">{p.name}</p>
              <p className={`text-2xl ${p.final_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {p.final_score > 0 ? '+' : ''}{p.final_score}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Round Button */}
      <button 
        onClick={() => setShowAddRound(!showAddRound)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        {showAddRound ? 'Cancel' : 'Add Round'}
      </button>

      {/* Add Round Form */}
      {showAddRound && (
        <form onSubmit={addRound} className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="font-semibold mb-4">New Round</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <select
              value={newRound.dealer_id}
              onChange={(e) => setNewRound({...newRound, dealer_id: e.target.value})}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Dealer</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={newRound.winner_id}
              onChange={(e) => setNewRound({...newRound, winner_id: e.target.value})}
              className="border p-2 rounded"
            >
              <option value="">Select Winner</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={newRound.loser_id}
              onChange={(e) => setNewRound({...newRound, loser_id: e.target.value})}
              className="border p-2 rounded"
            >
              <option value="">Select Loser</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Hand type (e.g., Pong, Kong, Win)"
              value={newRound.hand_type}
              onChange={(e) => setNewRound({...newRound, hand_type: e.target.value})}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Points"
              value={newRound.points}
              onChange={(e) => setNewRound({...newRound, points: e.target.value})}
              className="border p-2 rounded"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Record Round
          </button>
        </form>
      )}

      {/* Rounds History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Round History</h2>
        {rounds.length === 0 ? (
          <p className="p-6 text-gray-500">No rounds yet</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Dealer</th>
                <th className="p-4 text-left">Winner</th>
                <th className="p-4 text-left">Loser</th>
                <th className="p-4 text-left">Hand</th>
                <th className="p-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-4">{r.round_number}</td>
                  <td className="p-4">{r.dealer_name}</td>
                  <td className="p-4 text-green-600">{r.winner_name || '-'}</td>
                  <td className="p-4 text-red-600">{r.loser_name || '-'}</td>
                  <td className="p-4">{r.hand_type || '-'}</td>
                  <td className="p-4 text-right">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

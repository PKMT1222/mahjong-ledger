'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Player {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;
  status: string;
  created_at: string;
  player_count: number;
  players: Player[];
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  useEffect(() => {
    fetchPlayers();
    fetchGames();
  }, []);

  async function fetchPlayers() {
    const res = await fetch('/api/players');
    if (res.ok) setPlayers(await res.json());
  }

  async function fetchGames() {
    const res = await fetch('/api/games');
    if (res.ok) setGames(await res.json());
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlayerName })
    });
    if (res.ok) {
      setNewPlayerName('');
      fetchPlayers();
    }
  }

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    if (selectedPlayers.length < 2) {
      alert('Need at least 2 players');
      return;
    }
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGameName, playerIds: selectedPlayers })
    });
    if (res.ok) {
      setNewGameName('');
      setSelectedPlayers([]);
      fetchGames();
    }
  }

  async function initDb() {
    const res = await fetch('/api/init', { method: 'POST' });
    const data = await res.json();
    alert(data.message || data.error);
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">🀄 Mahjong Ledger</h1>
      
      <button onClick={initDb} className="bg-gray-600 text-white px-4 py-2 rounded mb-8 hover:bg-gray-700">
        Initialize Database
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Players Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Players</h2>
          
          <form onSubmit={addPlayer} className="mb-4">
            <input
              type="text"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="border p-2 rounded mr-2"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add
            </button>
          </form>

          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center p-2 bg-gray-50 rounded">
                <span className="flex-1">{p.name}</span>
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(p.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlayers([...selectedPlayers, p.id]);
                    } else {
                      setSelectedPlayers(selectedPlayers.filter(id => id !== p.id));
                    }
                  }}
                  className="ml-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* New Game Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">New Game</h2>
          <form onSubmit={createGame}>
            <input
              type="text"
              placeholder="Game name"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              className="border p-2 rounded w-full mb-4"
              required
            />
            <p className="text-sm text-gray-600 mb-4">
              Selected: {selectedPlayers.length} players
            </p>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
              Create Game
            </button>
          </form>
        </div>
      </div>

      {/* Games List */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Games</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => (
            <Link 
              key={game.id} 
              href={`/game/${game.id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg">{game.name}</h3>
              <p className="text-gray-600">{game.player_count} players</p>
              <p className={`text-sm ${game.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                {game.status}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

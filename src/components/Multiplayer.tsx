import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, LogIn, Timer, Trophy } from 'lucide-react';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { supabase } from '../utils/supabase';
import { connectDB, collections } from '../utils/mongodb';

export const Multiplayer = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState('');
  
  const store = useMultiplayerStore();

  useEffect(() => {
    if (store.roomId) {
      const setupChangeStream = async () => {
        const db = await connectDB();
        const changeStream = db.collection(collections.players)
          .watch([{ $match: { 'fullDocument.room_id': store.roomId } }]);

        changeStream.on('change', async (change) => {
          // Update players when changes occur
          const players = await db.collection(collections.players)
            .find({ room_id: store.roomId })
            .toArray();
          
          store.updatePlayers(players.map(p => ({
            id: p._id.toString(),
            name: p.name,
            progress: p.progress,
            wpm: p.wpm
          })));
        });

        return () => changeStream.close();
      };

      setupChangeStream();
    }
  }, [store.roomId]);

  useEffect(() => {
    return () => {
      store.leaveRoom();
    };
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = await store.createRoom(playerName, duration);
      setShowCreateRoom(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await store.joinRoom(roomCode, playerName);
      setShowJoinRoom(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (!store.startTime) return;

    store.currentInput = input;

    if (input.endsWith(' ')) {
      const wordToCheck = input.trim();
      const currentWord = store.words[store.currentWordIndex];

      if (wordToCheck === currentWord) {
        store.updateProgress(store.currentWordIndex + 1, '');
      }
    }
  };

  if (store.roomId) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-emerald-400">Room: {store.roomCode}</h2>
            <button
              onClick={() => store.leaveRoom()}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              Leave Room
            </button>
          </div>
          
          {store.status === 'waiting' && (
            <div className="mt-4">
              <p className="text-gray-300">
                {store.isHost ? 'Waiting for players to join...' : 'Waiting for host to start the game...'}
              </p>
              {store.isHost && (
                <button
                  onClick={() => store.startGame()}
                  className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Start Game
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {store.players.map((player) => (
            <div
              key={player.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <p className="font-semibold text-emerald-400">{player.name}</p>
              <div className="mt-2">
                <div className="text-sm text-gray-400">Progress</div>
                <div className="h-2 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${(player.progress / store.words.length) * 100}%`
                    }}
                  />
                </div>
              </div>
              {player.wpm > 0 && (
                <p className="mt-2 text-sm text-gray-300">{player.wpm} WPM</p>
              )}
            </div>
          ))}
        </div>

        {store.status === 'playing' && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <div className="mb-6 text-lg leading-relaxed">
              {store.words.map((word, index) => (
                <span
                  key={index}
                  className={`mr-2 ${
                    index === store.currentWordIndex
                      ? 'bg-gray-700 p-1 rounded'
                      : index < store.currentWordIndex
                      ? 'text-emerald-400'
                      : 'text-gray-400'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={store.currentInput}
              onChange={handleInput}
              className="w-full p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
              placeholder="Type here..."
            />
          </div>
        )}

        {store.status === 'finished' && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-center mb-6 text-emerald-400 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              Results
            </h3>
            <div className="space-y-4">
              {[...store.players]
                .sort((a, b) => b.wpm - a.wpm)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-emerald-400">
                        #{index + 1}
                      </span>
                      <span className="text-gray-100">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">
                        {player.wpm} WPM
                      </p>
                      <p className="text-sm text-gray-300">
                        {player.accuracy}% accuracy
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-emerald-400 mb-2 flex items-center justify-center gap-2">
          <Users className="w-8 h-8" />
          Multiplayer Mode
        </h2>
        <p className="text-gray-300">Race against other players in real-time</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {!showCreateRoom && !showJoinRoom && (
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="bg-gray-800 rounded-lg shadow-xl p-8 hover:shadow-2xl transition-all border border-gray-700 hover:border-emerald-500/50"
          >
            <Plus className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-emerald-400">Create Room</h3>
            <p className="text-gray-300">Start a new typing race</p>
          </button>

          <button
            onClick={() => setShowJoinRoom(true)}
            className="bg-gray-800 rounded-lg shadow-xl p-8 hover:shadow-2xl transition-all border border-gray-700 hover:border-emerald-500/50"
          >
            <LogIn className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-emerald-400">Join Room</h3>
            <p className="text-gray-300">Enter an existing race</p>
          </button>
        </div>
      )}

      {showCreateRoom && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-emerald-400">Create Room</h3>
          <form onSubmit={handleCreateRoom}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Race Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-6 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setShowCreateRoom(false)}
              className="w-full mt-4 py-3 px-6 text-emerald-400 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {showJoinRoom && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-emerald-400">Join Room</h3>
          <form onSubmit={handleJoinRoom}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-gray-100"
                placeholder="Enter room code"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-6 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setShowJoinRoom(false)}
              className="w-full mt-4 py-3 px-6 text-emerald-400 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
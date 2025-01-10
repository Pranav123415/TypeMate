import { create } from 'zustand';
import { generateText } from '../utils/gemini';
import { connectDB, collections } from '../utils/mongodb';
import { ObjectId } from 'mongodb';
import { generateRandomString } from '../utils/helpers';

interface MultiplayerState {
  roomId: string | null;
  roomCode: string | null;
  players: any[];
  isHost: boolean;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  words: string[];
  currentWordIndex: number;
  currentInput: string;
  wpm: number;
  accuracy: number;
  duration: number;
  startTime: number | null;
  playerId: string | null;
}

interface MultiplayerStore extends MultiplayerState {
  createRoom: (playerName: string, duration: number) => Promise<string>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateProgress: (wordIndex: number, input: string) => Promise<void>;
  setReady: () => Promise<void>;
  startGame: () => Promise<void>;
  resetState: () => void;
  updatePlayers: (players: any[]) => void;
}

interface Player {
  _id: ObjectId;
  room_id: ObjectId;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  status: 'waiting' | 'ready' | 'playing';
  isHost: boolean;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  roomId: null,
  roomCode: null,
  players: [],
  isHost: false,
  status: 'waiting',
  words: [],
  currentWordIndex: 0,
  currentInput: '',
  wpm: 0,
  accuracy: 0,
  duration: 30,
  startTime: null,
  playerId: null,

  createRoom: async (playerName: string, duration: number) => {
    const db = await connectDB();
    const code = generateRoomCode();
    const words = await generateText();

    const room = await db.collection(collections.rooms).insertOne({
      code,
      status: 'waiting',
      words,
      duration,
      createdAt: new Date()
    });

    const player = await db.collection(collections.players).insertOne({
      room_id: room.insertedId,
      name: playerName,
      progress: 0,
      wpm: 0,
      isHost: true
    });

    set({
      roomId: room.insertedId.toString(),
      roomCode: code,
      players: [{
        id: player.insertedId.toString(),
        name: playerName,
        progress: 0,
        wpm: 0
      }],
      isHost: true,
      status: 'waiting',
      words,
      duration,
      playerId: player.insertedId.toString()
    });

    return code;
  },

  joinRoom: async (code: string, playerName: string) => {
    const db = await connectDB();
    
    const room = await db.collection(collections.rooms).findOne({ 
      code: code.toUpperCase() 
    });

    if (!room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Game already in progress');

    const player = await db.collection(collections.players).insertOne({
      room_id: room._id,
      name: playerName,
      progress: 0,
      wpm: 0,
      isHost: false
    });

    set({
      roomId: room._id,
      roomCode: room.code,
      words: room.words,
      duration: room.duration,
      status: 'waiting',
      playerId: player.insertedId.toString()
    });
  },

  leaveRoom: async () => {
    const { roomId, playerId } = get();
    if (roomId && playerId) {
      const db = await connectDB();
      await db.collection(collections.players).deleteOne({
        _id: new ObjectId(playerId)
      });
    }
    get().resetState();
  },

  updateProgress: async (wordIndex: number, input: string) => {
    const { roomId, playerId, words, startTime } = get();
    if (!roomId || !playerId || !startTime) return;

    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    const correctWords = wordIndex;
    const wpm = Math.round((correctWords / timeElapsed) || 0);
    const accuracy = Math.round((correctWords / words.length) * 100);

    const db = await connectDB();
    await db.collection(collections.players).updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { progress: wordIndex, wpm, accuracy } }
    );

    set({ currentWordIndex: wordIndex, currentInput: input, wpm, accuracy });
  },

  setReady: async () => {
    const { playerId } = get();
    if (!playerId) return;

    const db = await connectDB();
    await db.collection(collections.players).updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { status: 'ready' } }
    );
  },

  startGame: async () => {
    const { roomId } = get();
    if (!roomId) return;

    const db = await connectDB();
    await db.collection(collections.rooms).updateOne(
      { _id: new ObjectId(roomId) },
      { 
        $set: { 
          status: 'playing',
          started_at: new Date()
        }
      }
    );

    set({ status: 'playing', startTime: Date.now() });
  },

  resetState: () => {
    set({
      roomId: null,
      roomCode: null,
      players: [],
      isHost: false,
      status: 'waiting',
      words: [],
      currentWordIndex: 0,
      currentInput: '',
      wpm: 0,
      accuracy: 0,
      duration: 30,
      startTime: null,
      playerId: null
    });
  },

  updatePlayers: (players) => {
    set({ players });
  }
}));
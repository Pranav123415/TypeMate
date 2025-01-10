import { ObjectId } from 'mongodb';

export interface Room {
  _id: ObjectId;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  words: string[];
  duration: number;
  createdAt: Date;
  started_at?: Date;
}

export interface Player {
  _id: ObjectId;
  room_id: ObjectId;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  status: 'waiting' | 'ready' | 'playing';
  isHost: boolean;
} 
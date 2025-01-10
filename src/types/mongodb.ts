import { ObjectId } from 'mongodb';

export interface MongoRoom {
  _id: ObjectId;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  words: string[];
  duration: number;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface MongoPlayer {
  _id: ObjectId;
  room_id: ObjectId;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isHost: boolean;
  createdAt: Date;
  lastActive: Date;
} 
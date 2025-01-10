import { ObjectId } from 'mongodb';
import { connectDB, collections } from '../utils/mongodb';
import type { MongoRoom, MongoPlayer } from '../types/mongodb';

export const DatabaseService = {
  async createRoom(code: string, words: string[], duration: number): Promise<MongoRoom> {
    const db = await connectDB();
    
    const room = await db.collection<MongoRoom>(collections.rooms).insertOne({
      code,
      status: 'waiting',
      words,
      duration,
      createdAt: new Date()
    } as MongoRoom);

    return {
      _id: room.insertedId,
      code,
      status: 'waiting',
      words,
      duration,
      createdAt: new Date()
    };
  },

  async createPlayer(roomId: ObjectId, name: string, isHost: boolean): Promise<MongoPlayer> {
    const db = await connectDB();
    
    const player = await db.collection<MongoPlayer>(collections.players).insertOne({
      room_id: roomId,
      name,
      progress: 0,
      wpm: 0,
      accuracy: 0,
      isHost,
      createdAt: new Date(),
      lastActive: new Date()
    } as MongoPlayer);

    return {
      _id: player.insertedId,
      room_id: roomId,
      name,
      progress: 0,
      wpm: 0,
      accuracy: 0,
      isHost,
      createdAt: new Date(),
      lastActive: new Date()
    };
  },

  async updatePlayerProgress(playerId: ObjectId, progress: number, wpm: number, accuracy: number) {
    const db = await connectDB();
    
    return db.collection<MongoPlayer>(collections.players).updateOne(
      { _id: playerId },
      {
        $set: {
          progress,
          wpm,
          accuracy,
          lastActive: new Date()
        }
      }
    );
  },

  async getRoomByCode(code: string): Promise<MongoRoom | null> {
    const db = await connectDB();
    return db.collection<MongoRoom>(collections.rooms).findOne({ code });
  },

  async getRoomPlayers(roomId: ObjectId): Promise<MongoPlayer[]> {
    const db = await connectDB();
    return db.collection<MongoPlayer>(collections.players)
      .find({ room_id: roomId })
      .toArray();
  }
}; 
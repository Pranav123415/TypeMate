import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let db: Db;

export const collections = {
  rooms: 'rooms',
  players: 'players',
} as const;

export async function connectDB() {
  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(uri, {
        // Add MongoDB connection options
        connectTimeoutMS: 10000, // Connection timeout
        socketTimeoutMS: 45000,  // Socket timeout
      });
      await client.connect();
    }
    
    db = client.db('typemate');

    // Create indexes
    await createIndexes(db);

    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function createIndexes(db: Db) {
  try {
    // Rooms collection indexes
    await db.collection(collections.rooms).createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 3600 } // Auto-delete after 1 hour
    ]);

    // Players collection indexes
    await db.collection(collections.players).createIndexes([
      { key: { room_id: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 3600 }
    ]);
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
} 
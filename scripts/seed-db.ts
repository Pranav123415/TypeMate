import { connectDB, collections, disconnectDB } from '../src/utils/mongodb';

async function seed() {
  try {
    const db = await connectDB();

    // Clear existing data
    await db.collection(collections.rooms).deleteMany({});
    await db.collection(collections.players).deleteMany({});

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await disconnectDB();
  }
}

seed(); 
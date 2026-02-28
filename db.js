import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  }
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export default { connectDB, getDB };

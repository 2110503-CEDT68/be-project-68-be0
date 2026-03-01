import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const client = new MongoClient(connectionString);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db();
    await mongoose.connect(connectionString);
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

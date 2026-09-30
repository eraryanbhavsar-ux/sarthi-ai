import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let isInMemoryFallback = false;

export async function connectDB() {
  if (!env.MONGODB_URI) {
    console.warn('[SARTHI DB] No MONGODB_URI provided. Running with in-memory persistence fallback.');
    isInMemoryFallback = true;
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[SARTHI DB] Connected to MongoDB Atlas / Database: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[SARTHI DB] MongoDB connection failed (${error.message}). Activating in-memory persistence fallback for uninterrupted offline evaluation.`);
    isInMemoryFallback = true;
    return false;
  }
}

export function getDBStatus() {
  return {
    isConnected,
    isInMemoryFallback,
    ready: isConnected || isInMemoryFallback,
  };
}

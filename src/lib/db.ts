import mongoose from 'mongoose';
import { logMongoError } from '@/lib/mongo-error';

interface MongoDBError extends Error {
  code?: number;
  message: string;
}

// Checked when a connection is opened, not when the module loads: `next build` imports every route to read its
// config, so a module-level throw fails the whole build on a host where the variable is only set at runtime.
function mongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env')
  }
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB connection string. Must start with "mongodb://" or "mongodb+srv://"')
  }
  return uri;
}

async function closeMongoClient(client: InstanceType<typeof mongoose.mongo.MongoClient>): Promise<void> {
  try {
    await client.close();
  } catch (error) {
    logMongoError('mongo_client_close_failed', error);
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isConnected(connection: mongoose.Connection): boolean {
  return connection.readyState === 1;
}

export default async function connectDB(): Promise<typeof mongoose> {
  const connection = mongoose.connection;
  if (connection.readyState === 1) {
    return mongoose;
  }
  if (connection.readyState !== 0) {
    const error = new Error(`MongoDB connection is not ready (state ${connection.readyState})`);
    logMongoError('mongo_connection_unavailable', error, { readyState: connection.readyState });
    throw error;
  }

  let uri: string;
  try {
    uri = mongoUri();
  } catch (error) {
    logMongoError('mongo_connection_config_failed', error);
    throw error;
  }

  // Each serverless runtime instance keeps its own pool, so a large minPoolSize multiplies
  // into many idle Atlas connections and can cause resets/timeouts.
  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // The free Atlas M0 tier allows 500 connections in total, shared by every instance.
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
  };

  for (let attempt = 0; attempt <= 1; attempt++) {
    const client = new mongoose.mongo.MongoClient(uri, opts);
    try {
      console.info(JSON.stringify({ event: 'mongo_connection_attempt' }));
      await client.connect();

      // Another request may have established its own connection while this one was opening.
      if (isConnected(connection)) {
        await closeMongoClient(client);
        console.info(JSON.stringify({ event: 'mongo_connection_reused' }));
        return mongoose;
      }

      if (connection.readyState !== 0) {
        throw new Error(`MongoDB connection changed state while connecting (${connection.readyState})`);
      }

      connection.config.bufferCommands = true;
      connection.config.autoIndex = true;
      connection.setClient(client);
      console.info(JSON.stringify({ event: 'mongo_connection_established' }));
      return mongoose;
    } catch (error) {
      await closeMongoClient(client);
      const dbError = error as MongoDBError;
      if (dbError.code === 8000 || dbError.message.includes('bad auth') || attempt === 1) {
        logMongoError('mongo_connection_failed', error);
        throw error;
      }

      console.warn(JSON.stringify({ event: 'mongo_connection_retry', attempt: attempt + 1 }));
      await sleep(1000);
    }
  }

  throw new Error('MongoDB connection failed after retries');
}

export { connectDB as connectToDatabase };

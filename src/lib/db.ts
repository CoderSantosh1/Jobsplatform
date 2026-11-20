import mongoose from 'mongoose';
import { logMongoError } from '@/lib/mongo-error';
import './mongoose-config';
import { connectCandidateClient } from './mongo-connection-lifecycle';

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

let connectionOperationSequence = 0;
const initializedModelIndexes = new Set<string>();

function isConnected(connection: mongoose.Connection): boolean {
  return connection.readyState === 1;
}

async function ensureModelIndexes(operationId: number): Promise<void> {
  const pendingModels = Object.entries(mongoose.connection.models).filter(
    ([name]) => !initializedModelIndexes.has(name),
  );
  if (pendingModels.length === 0) return;

  console.info(JSON.stringify({
    event: 'mongo_model_indexes_started',
    operationId,
    modelCount: pendingModels.length,
  }));
  const results = await Promise.allSettled(
    pendingModels.map(([, model]) => model.ensureIndexes()),
  );
  const failures: string[] = [];

  results.forEach((result, index) => {
    const [modelName] = pendingModels[index];
    if (result.status === 'fulfilled') {
      initializedModelIndexes.add(modelName);
    } else {
      failures.push(modelName);
      logMongoError('mongo_model_index_initialization_failed', result.reason, {
        operationId,
        modelName,
      });
    }
  });

  if (failures.length > 0) {
    throw new Error(`MongoDB indexes failed to initialize for ${failures.length} model(s)`);
  }

  console.info(JSON.stringify({
    event: 'mongo_model_indexes_ready',
    operationId,
    modelCount: pendingModels.length,
  }));
}

export default async function connectDB(): Promise<typeof mongoose> {
  const operationId = ++connectionOperationSequence;
  const connection = mongoose.connection;
  if (connection.readyState === 1) {
    console.info(JSON.stringify({ event: 'mongo_connection_reused', operationId, source: 'established' }));
    await ensureModelIndexes(operationId);
    return mongoose;
  }
  if (connection.readyState !== 0) {
    const error = new Error(`MongoDB connection is not ready (state ${connection.readyState})`);
    logMongoError('mongo_connection_unavailable', error, { operationId, readyState: connection.readyState });
    throw error;
  }

  let uri: string;
  try {
    uri = mongoUri();
  } catch (error) {
    logMongoError('mongo_connection_config_failed', error, { operationId });
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
    let outcome: 'connected' | 'reused';
    try {
      console.info(JSON.stringify({ event: 'mongo_connection_attempt', operationId, attempt: attempt + 1 }));
      outcome = await connectCandidateClient(client, {
        isConnected: () => isConnected(connection),
        isDisconnected: () => connection.readyState === 0,
        attach: (candidate) => {
          connection.config.bufferCommands = true;
          connection.config.autoCreate = false;
          connection.config.autoIndex = false;
          connection.setClient(candidate);
        },
      }, closeMongoClient);
    } catch (error) {
      const alreadyAttached = connection.getClient() === client;
      if (!alreadyAttached) await closeMongoClient(client);
      const dbError = error as MongoDBError;
      const stateChanged = connection.readyState !== 0 && !isConnected(connection);
      if (alreadyAttached || stateChanged || dbError.code === 8000 || dbError.message.includes('bad auth') || attempt === 1) {
        logMongoError('mongo_connection_failed', error, { operationId, attempt: attempt + 1 });
        throw error;
      }

      console.warn(JSON.stringify({ event: 'mongo_connection_retry', operationId, attempt: attempt + 1 }));
      await sleep(1000);
      continue;
    }

    if (outcome === 'reused') {
      console.info(JSON.stringify({ event: 'mongo_connection_reused', operationId, source: 'concurrent_candidate' }));
    } else {
      console.info(JSON.stringify({ event: 'mongo_connection_established', operationId }));
    }

    await ensureModelIndexes(operationId);
    return mongoose;
  }

  const error = new Error('MongoDB connection failed after retries');
  logMongoError('mongo_connection_failed', error, { operationId });
  throw error;
}

export { connectDB as connectToDatabase };

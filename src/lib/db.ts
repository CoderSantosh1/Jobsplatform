import mongoose from 'mongoose';

interface MongoDBError extends Error {
  code?: number;
  message: string;
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface GlobalWithMongoose extends Global {
  mongoose: CachedConnection;
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

let cached: CachedConnection = ((global as unknown) as GlobalWithMongoose).mongoose;

if (!cached) {
  cached = ((global as unknown) as GlobalWithMongoose).mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = mongoUri();
    // Serverless-friendly pool: every Vercel function instance keeps its own pool, so a large
    // minPoolSize multiplies into hundreds of idle Atlas connections and causes resets/timeouts.
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // The free Atlas M0 tier allows 500 connections in total, shared by every instance.
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      autoIndex: true
    };

    let retries = 1;
    const connect = async () => {
      try {
        console.log('Attempting to connect to MongoDB...');
        const mongooseInstance = await mongoose.connect(MONGODB_URI, opts);
        console.log('MongoDB connected successfully');
        return mongooseInstance;
      } catch (error) {
        const dbError = error as MongoDBError;
        console.error('MongoDB connection error:', dbError);
        
        if (dbError.code === 8000 || dbError.message.includes('bad auth')) {
          console.error('MongoDB Authentication Error: Please check your credentials in .env file');
          console.error('Make sure your MongoDB Atlas connection string is in the format: mongodb+srv://<username>:<password>@<cluster-url>/<database>');
          throw dbError;
        } else if (retries > 0 && !dbError.message.includes('bad auth')) {
          console.warn(`Connection failed, retrying... (${retries} attempts remaining)`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
          return connect();
        } else {
          console.error('MongoDB Connection Error:', dbError.message);
          throw dbError;
        }
      }
    };
    cached.promise = connect();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to establish database connection:', e);
    throw e;
  }

  return cached.conn;
}

export { connectDB as connectToDatabase };
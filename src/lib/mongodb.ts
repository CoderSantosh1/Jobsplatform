// Kept for the routes that import "@/lib/mongodb". It used to open its own connection with Mongoose's default
// pool (100 per server); now every route shares the single, capped connection from db.ts.
export { default } from './db';

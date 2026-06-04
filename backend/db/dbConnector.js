import dotenv from 'dotenv';
import { localJsonDb } from './localJsonDb.js';

dotenv.config();

// Database Connector
// Automatically uses the local JSON database file.
// If extending to a production database (like PostgreSQL/Supabase),
// developers can implement a postgres client here and toggle based on process.env.DATABASE_URL.
export const db = localJsonDb;

// Initialize data files on start
db.init();
export default db;

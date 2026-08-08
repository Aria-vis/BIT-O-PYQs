import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to Neon PostgreSQL successfully!');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default pool;
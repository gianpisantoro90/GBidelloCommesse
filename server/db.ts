import * as schema from "@shared/schema";

console.log('🔧 Database configuration loading...');

let pool: any = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set, application will use memory storage');
} else {
  const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech');

  if (isNeonDatabase) {
    // Use Neon serverless with WebSocket
    console.log('📡 Connecting to Neon serverless database...');
    try {
      const { Pool, neonConfig } = require('@neondatabase/serverless');
      const { drizzle } = require('drizzle-orm/neon-serverless');
      const ws = require('ws');

      neonConfig.webSocketConstructor = ws;
      console.log('📡 Configured Neon WebSocket for serverless environment');

      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      db = drizzle({ client: pool, schema });
      console.log('✅ Neon database connection established');
    } catch (error) {
      console.error('❌ Failed to create Neon database connection:', error);
      pool = null;
      db = null;
    }
  } else {
    // Use standard PostgreSQL
    console.log('🗄️ Connecting to PostgreSQL database (local mode)...');
    try {
      const { Pool } = require('pg');
      const { drizzle } = require('drizzle-orm/node-postgres');

      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      db = drizzle(pool, { schema });

      // Test connection
      pool.connect()
        .then((client: any) => {
          console.log('✅ PostgreSQL connection established');
          client.release();
        })
        .catch((err: any) => {
          console.error('❌ PostgreSQL connection failed:', err.message);
        });
    } catch (error) {
      console.error('❌ Failed to create PostgreSQL connection:', error);
      pool = null;
      db = null;
    }
  }
}

export { pool, db };

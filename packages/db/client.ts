import { Pool } from 'pg';
import { env } from '../../config/env.js';

/**
 * Singleton PostgreSQL connection pool.
 */
class DBClient {
  private static instance: Pool;

  private constructor() {}

  public static getInstance(): Pool {
    if (!DBClient.instance) {
      DBClient.instance = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });

      // Handle generic pool errors
      DBClient.instance.on('error', (err) => {
        console.error('Unexpected error on idle pg client', err);
        process.exit(-1);
      });
    }
    return DBClient.instance;
  }
}

export const db = DBClient.getInstance();

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/**
 * Initializes and returns the MySQL connection pool lazily.
 * This guarantees that Next.js compilation ('npm run build') succeeds
 * even when database credentials are not present in the build environment.
 */
export function getPool(): mysql.Pool {
  if (pool) return pool;

  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (
    typeof dbHost !== 'string' ||
    typeof dbUser !== 'string' ||
    typeof dbPassword !== 'string' ||
    typeof dbName !== 'string'
  ) {
    throw new Error(
      'Missing required database configuration environment variables at runtime. Please define DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.'
    );
  }

  pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return pool;
}

/**
 * Type-safe query helper for executing SQL statements.
 * Uses parameterized queries to strictly prevent SQL Injection.
 */
export async function query<
  T extends
    | mysql.RowDataPacket[][]
    | mysql.RowDataPacket[]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader
>(sql: string, params?: (string | number | boolean | null)[]): Promise<T> {
  const activePool = getPool();
  const [results] = await activePool.execute<T>(sql, params);
  return results;
}

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: mysql.Pool | null = null;
let isInitialized = false;
let initializingPromise: Promise<void> | null = null;

/**
 * Verifies if the database exists (creates it if not) and checks if the schema
 * needs to be initialized. Runs only once on startup when the first query is made.
 */
async function runInitialization(): Promise<void> {
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

  // 1. Connect without specifying the database first to ensure the database itself exists
  try {
    const tempConnection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();
  } catch (error) {
    console.error('Failed to ensure database existence:', error);
    throw error;
  }

  // 2. Connect to the database and check if the tables need to be created
  const checkPool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    // Check if the main 'users' table exists as an indicator of database schema setup
    const [rows] = await checkPool.query<mysql.RowDataPacket[]>(
      `SHOW TABLES LIKE 'users'`
    );

    if (rows.length === 0) {
      console.log('Database tables not found. Initializing database from schema.sql...');
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Split SQL statements by ';' and execute them in order
        const statements = schemaSql
          .split(';')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          await checkPool.query(statement);
        }
        console.log('Database initialized successfully from schema.sql.');
      } else {
        console.warn('schema.sql not found at project root. Skipping automatic table initialization.');
      }
    }
  } catch (error) {
    console.error('Error during database table initialization:', error);
    throw error;
  } finally {
    await checkPool.end();
  }
}

/**
 * Gatekeeper function to ensure database setup has completed before query execution.
 */
export async function ensureDatabaseSetup(): Promise<void> {
  if (isInitialized) return;
  if (!initializingPromise) {
    initializingPromise = runInitialization()
      .then(async () => {
        // Run migration: ensure todos table has category column
        try {
          const activePool = getPool();
          await activePool.query(`ALTER TABLE todos ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general'`);
        } catch (e) {
          // Ignored if column already exists
        }
        isInitialized = true;
      })
      .catch((err) => {
        initializingPromise = null; // reset on error so subsequent queries can retry
        throw err;
      });
  }
  return initializingPromise;
}

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
  await ensureDatabaseSetup();
  const activePool = getPool();
  const [results] = await activePool.execute<T>(sql, params);
  return results;
}


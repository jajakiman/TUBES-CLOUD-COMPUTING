const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const envPath = path.resolve(__dirname, '../.env.local');
  const schemaPath = path.resolve(__dirname, '../schema.sql');

  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found at', envPath);
    process.exit(1);
  }

  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema.sql not found at', schemaPath);
    process.exit(1);
  }

  // Parse .env.local manually
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });

  const host = env.DB_HOST || '127.0.0.1';
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'tubes_cc';

  console.log(`Connecting to MySQL at ${host} as ${user}...`);

  // Establish connection to MySQL server first (without database to run CREATE DATABASE)
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Database and tables migrated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

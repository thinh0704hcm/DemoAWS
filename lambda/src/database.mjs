// src/database.mjs
import pkg from 'pg';
const { Pool } = pkg;
import { DsqlSigner } from '@aws-sdk/dsql-signer';

let pool;

async function initializePool() {
  console.log('Initializing connection pool');
  console.log('Using region:', process.env.DB_REGION);
  console.log('Using hostname:', process.env.DB_HOST);

  const signer = new DsqlSigner({
    hostname: process.env.DB_HOST,
    region: process.env.DB_REGION,
  });

  const token = await signer.getDbConnectAdminAuthToken();
  console.log('Admin token generated successfully');

  pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    user: 'admin',
    password: token,
    database: 'postgres',
    ssl: true,
    max: 1,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    pool = null; // Reset pool for reinitialization
  });

  const client = await pool.connect();
  client.release();
  console.log('Connection pool initialized successfully');
}

async function getPool() {
  if (!pool) {
    await initializePool();
  }
  return pool;
}

export async function query(text, params) {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
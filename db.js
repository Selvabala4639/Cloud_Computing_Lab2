const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  return pool.query(text, params);
}

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(schema);
  console.log('Database initialized');
  process.exit(0);
}

module.exports = { pool, query, init };

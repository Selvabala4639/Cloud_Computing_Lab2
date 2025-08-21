require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { query } = require('./db');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/contacts', async (req, res) => {
  try {
    const result = await query('SELECT * FROM contacts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function initializeDatabase() {
  try {
    // Create database if it doesn't exist (requires separate connection)
    const adminPool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      password: process.env.DB_PASSWORD || "yourpassword",
      port: process.env.DB_PORT || 5432,
    });

    await adminPool
      .query(`CREATE DATABASE ${process.env.DB_NAME || "contact_manager"};`)
      .catch((err) =>
        console.log("Database already exists or creation failed:", err.message)
      );
    await adminPool.end();

    // Create table if it doesn't exist
    await pool.query(`
            CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          INSERT INTO contacts (name, email, phone)
          VALUES
            ('Alice Johnson', 'alice@example.com', '123-456-7890'),
            ('Bob Smith', 'bob@example.com', '987-654-3210')
          ON CONFLICT DO NOTHING;

        `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}


app.get('/api/contacts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM contacts WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await query(
      `INSERT INTO contacts (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email || null, phone || null]
    );
    res.status(201).json(result.rows);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email must be unique' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone } = req.body || {};
    const result = await query(
      `UPDATE contacts
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name || null, email || null, phone || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email must be unique' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM contacts WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: result.rows.id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${PORT}`);
  });
});



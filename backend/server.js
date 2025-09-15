const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get table name from repository name
const repoName = path.basename(process.cwd());
const tableName = `todos_${repoName}`.replace(/[^a-zA-Z0-9_]/g, '_');

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`Database table ${tableName} initialized`);
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initDB();

// Get todos
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Add todo with AI processing
app.post('/api/todos', async (req, res) => {
  try {
    let { text } = req.body;
    
    // Read prompt from file
    const promptPath = path.join(__dirname, 'prompt.txt');
    let systemPrompt = 'Process the user input into a todo item.';
    
    try {
      systemPrompt = fs.readFileSync(promptPath, 'utf8').trim();
    } catch (err) {
      console.log('Using default prompt');
    }
    
    // Process with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      max_tokens: 100
    });
    
    const processedText = response.choices[0].message.content.trim();
    
    // Save to database
    const result = await pool.query(
      `INSERT INTO ${tableName} (text) VALUES ($1) RETURNING *`,
      [processedText]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding todo:', err);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// Toggle todo completion
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const result = await pool.query(
      `UPDATE ${tableName} SET completed = $1 WHERE id = $2 RETURNING *`,
      [completed, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using table: ${tableName}`);
});
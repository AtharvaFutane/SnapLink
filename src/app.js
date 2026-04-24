require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve test UI at root
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server after database is ready
const start = async () => {
  // Initialize SQLite (must complete before routes use it)
  await initDb();

  // Import routes AFTER db is initialized
  const urlRoutes = require('./routes/urlRoutes');
  const { redirect } = require('./controllers/urlController');

  // API routes — must come BEFORE the catch-all redirect
  app.use('/api', urlRoutes);

  // Redirect route — catch-all for short codes
  app.get('/:code', redirect);

  // Global error handler — must be last
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;

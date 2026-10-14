const express = require('express');
const cors = require('cors');

// Build the Express app separately from server.js so tests can import it
function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/hostels', require('./routes/hostels'));
  app.use('/api/applications', require('./routes/applications'));
  app.use('/api/allocations', require('./routes/allocations'));
  app.use('/api/admin', require('./routes/admin'));

  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
  return app;
}

module.exports = createApp;
// ---------------------------------------------------------------------------
// server.js
// Purpose: application entry point. Loads environment variables, connects to
// MongoDB, then starts listening for HTTP requests on PORT.
// ---------------------------------------------------------------------------

require('dotenv').config({ quiet: true });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Doctor Tracker API listening on http://localhost:${PORT}`);
    });

    // Close the HTTP server cleanly when the process is stopped (Ctrl+C).
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Closing the server...`);
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
}

startServer();

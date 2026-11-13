// ---------------------------------------------------------------------------
// config/db.js
// Purpose: open a single, reusable connection to MongoDB Atlas with Mongoose.
// Called once from server.js and from the admin seed script.
// ---------------------------------------------------------------------------

const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 *
 * Mongoose keeps a global connection pool, so calling connectDB() once is
 * enough for the entire Express process. The function is asynchronous because
 * Atlas may take a moment to establish the (TLS) connection.
 */
async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is missing. Copy .env.example to .env and add your MongoDB Atlas connection string.'
    );
  }

  // Mongoose 9 no longer needs useNewUrlParser / useUnifiedTopology flags.
  const connection = await mongoose.connect(mongoUri);

  console.log(
    `MongoDB connected -> host: ${connection.connection.host}, database: ${connection.connection.name}`
  );

  return connection;
}

module.exports = connectDB;

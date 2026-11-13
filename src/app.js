// ---------------------------------------------------------------------------
// app.js
// Purpose: build and configure the Express application (middleware + routes)
// without starting a network listener. server.js starts the listener after the
// database connects. Keeping these separate makes the app easier to test.
// ---------------------------------------------------------------------------

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Allow the configured frontend origin(s). Credentials must be enabled so the
// browser sends and stores the HttpOnly authentication cookie.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin (curl, server-to-server) are allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(`Origin ${origin} is not allowed by CORS.`);
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Small unconditional endpoint for uptime checks and quick connectivity tests.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Doctor Tracker API is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 for unknown routes, then the shared error formatter.
app.use(notFound);
app.use(errorHandler);

module.exports = app;

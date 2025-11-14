require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./src/config/db');
const { voiceWebhookHandler } = require('./src/controllers/voiceController');
const { smsWebhookHandler } = require('./src/controllers/smsController');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const numberRoutes = require('./src/routes/numberRoutes');
const voiceRoutes = require('./src/routes/voiceRoutes');
const smsRoutes = require('./src/routes/smsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();

// Connect DB
connectDB();

// Middleware
const rawOrigins =
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,http://localhost:5000';

const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow mobile apps / curl etc with no origin
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // eslint-disable-next-line no-console
      console.warn('Blocked CORS origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/numbers', numberRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/notifications', notificationRoutes);

// Telnyx webhooks
app.post('/webhooks/voice', voiceWebhookHandler);
app.post('/webhooks/sms', smsWebhookHandler);

// In production we serve the React SPA build (if present)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const hasFrontendDist = fs.existsSync(frontendDist);

if (hasFrontendDist) {
  app.use(express.static(frontendDist));

  // Let React Router handle all non-API, non-webhook routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`VOIP backend server listening on port ${PORT}`);
});

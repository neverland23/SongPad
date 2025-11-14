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

// ------------------------------
// ✅ FIXED CORS CONFIGURATION
// ------------------------------
const allowedOrigins = [
  "http://localhost:5173",                // Vite
  "http://localhost:3000",                // React dev
  "https://song-pad.vercel.app",          // PRODUCTION frontend
  "https://stage-song-pad.vercel.app"     // STAGING frontend (optional)
];

// CORS middleware MUST be before routes
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow mobile apps / curl / Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Support OPTIONS preflight
app.options("*", cors());

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json());
app.use(morgan('dev'));

// ------------------------------
// API ROUTES
// ------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/numbers', numberRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/notifications', notificationRoutes);

// ------------------------------
// WEBHOOKS (no CORS needed) 
// ------------------------------
app.post('/webhooks/voice', voiceWebhookHandler);
app.post('/webhooks/sms', smsWebhookHandler);

// ------------------------------
// Serve React Frontend (if exists)
// ------------------------------
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const hasFrontendDist = fs.existsSync(frontendDist);

if (hasFrontendDist) {
  console.log("Serving frontend from:", frontendDist);

  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ------------------------------
// Fallback for API 404
// ------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 VOIP backend server running on port ${PORT}`);
});

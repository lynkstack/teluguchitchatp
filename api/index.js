const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Global Request Logger for Vercel / serverless logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// Load routes with explicit .cjs extensions
const userRoute = require('../backend/routes/user.cjs');
const authRoute = require('../backend/routes/auth.cjs');
const messagesRoute = require('../backend/routes/messages.cjs');
const mediaRoute = require('../backend/routes/media.cjs');
const groupsRoute = require('../backend/routes/groups.cjs');
const aiRoute = require('../backend/routes/ai.cjs');
const versionRoute = require('../backend/routes/version.cjs');
const supabase = require('../backend/supabaseClient.cjs');

// Mock socket.io getter for serverless environment
app.set('io', {
  to: () => ({ emit: () => {} }),
  emit: () => {}
});

// Diagnostic & health check endpoints
const getHealthStatus = async () => {
  const envStatus = {
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SUPABASE_KEY: !!process.env.SUPABASE_KEY,
    has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_JWT_SECRET: !!process.env.JWT_SECRET,
    has_GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
  };

  let dbStatus = 'testing';
  let dbError = null;
  let userCount = 0;
  try {
    const { data, error, count } = await supabase.from('users').select('id', { count: 'exact' }).limit(1);
    if (error) {
      dbStatus = 'error';
      dbError = error.message;
    } else {
      dbStatus = 'connected';
      userCount = count || (data ? data.length : 0);
    }
  } catch (err) {
    dbStatus = 'exception';
    dbError = err.message;
  }

  return {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    serverless: true,
    time: new Date().toISOString(),
    env: envStatus,
    database: {
      status: dbStatus,
      userCount,
      error: dbError
    }
  };
};

app.get('/health', async (req, res) => {
  try {
    const result = await getHealthStatus();
    res.json(result);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await getHealthStatus();
    res.json(result);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/api/debug', async (req, res) => {
  try {
    const health = await getHealthStatus();
    res.json({
      ...health,
      nodeVersion: process.version,
      vercelEnv: process.env.VERCEL_ENV || 'local',
      headers: {
        host: req.headers.host,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Mount routes with /api prefix
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/media', mediaRoute);
app.use('/api/groups', groupsRoute);
app.use('/api/ai', aiRoute);
app.use('/api/version', versionRoute);

// Mount routes without /api prefix for compatibility
app.use('/users', userRoute);
app.use('/auth', authRoute);
app.use('/messages', messagesRoute);
app.use('/media', mediaRoute);
app.use('/groups', groupsRoute);
app.use('/ai', aiRoute);
app.use('/version', versionRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Serverless Global Error:', err);
  res.status(err.status || 500).json({
    msg: err.message || 'Internal Server Error'
  });
});

module.exports = app;

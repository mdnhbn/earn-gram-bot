import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock Data for Fallback
const MOCK_TASKS = [
  { id: '1', title: 'Join Telegram Channel', reward: 0.5, type: 'telegram', url: 'https://t.me/EarnGramNews' },
  { id: '2', title: 'Follow on Twitter', reward: 0.3, type: 'twitter', url: 'https://twitter.com/EarnGram' },
  { id: '3', title: 'Watch Video Ad', reward: 0.1, type: 'video', url: '#' }
];

const MOCK_AD_TASKS = [
  { id: 'ad1', title: 'Quick Boost', reward: 0.05, type: 'adsterra' }
];

// Health check endpoint for the platform
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:password@cluster.mongodb.net/earngram?retryWrites=true&w=majority';
const client = new MongoClient(MONGO_URI);
const dbName = 'earngram_prod';

// State for collections
let usersCol: any = null;
let transactionsCol: any = null;
let tasksCol: any = null;
let adTasksCol: any = null;
let settingsCol: any = null;

// Background DB Connection
client.connect().then(() => {
  console.log('Connected to MongoDB');
  const db = client.db(dbName);
  usersCol = db.collection<any>('users');
  transactionsCol = db.collection<any>('transactions');
  tasksCol = db.collection<any>('tasks');
  adTasksCol = db.collection<any>('ad_tasks');
  settingsCol = db.collection<any>('settings');
}).catch(err => {
  console.error('Failed to connect to MongoDB (will use mock data):', err);
});

// API Proxy to Python Backend (bot.py on port 8888)
app.use('/api', proxy('http://127.0.0.1:8888', {
  proxyReqPathResolver: (req) => {
    return '/api' + req.url;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy Error:', err.message);
    res.status(503).json({ error: 'Backend service unavailable', details: err.message });
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    // Ensure we always return JSON even if backend fails
    const contentType = proxyRes.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      return proxyResData;
    }
    
    // If not JSON, return a safe error object
    if (proxyRes.statusCode >= 400) {
      return JSON.stringify({ error: 'Backend error', status: proxyRes.statusCode });
    }
    return proxyResData;
  }
}));

async function startServer() {
  console.log('Starting server initialization...');
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Server is listening on port ${PORT} <<<`);
  });
}

startServer();

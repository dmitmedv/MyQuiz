import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { vocabularyRoutes } from './routes/vocabulary';
import { practiceRoutes } from './routes/practice';
import { authRoutes } from './routes/auth';
import userSettingsRoutes from './routes/user-settings';
import { initializeDatabase } from './database/init';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(cors({
  origin: NODE_ENV === 'production' ? false : true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// Health check endpoint (public, no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/user', userSettingsRoutes);

// Serve React app for any non-API routes (production only)
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Initialize database and start server
async function startServer() {
  try {
    console.log(`Starting server in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`Current working directory: ${process.cwd()}`);
    
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} on all interfaces`);
      console.log(`Environment: ${NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
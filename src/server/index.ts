import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { vocabularyRoutes } from './routes/vocabulary';
import { practiceRoutes } from './routes/practice';
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

// API Routes
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/practice', practiceRoutes);

// Serve React app for any non-API routes (production only)
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
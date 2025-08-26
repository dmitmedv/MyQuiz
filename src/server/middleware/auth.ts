import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';
import { User } from '../types';

// JWT secret key - should match the one in auth routes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password_hash'>;
    }
  }
}

// Middleware to authenticate and authorize requests
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Get user data from database
    const user = await new Promise<Omit<User, 'password_hash'> | null>((resolve, reject) => {
      db.get(
        'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Omit<User, 'password_hash'> | null);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional middleware for routes that can work with or without authentication
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      
      const user = await new Promise<Omit<User, 'password_hash'> | null>((resolve, reject) => {
        db.get(
          'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
          [decoded.userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row as Omit<User, 'password_hash'> | null);
          }
        );
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just proceed without user
    next();
  }
}

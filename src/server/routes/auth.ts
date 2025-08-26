import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';
import { User, CreateUserRequest, LoginRequest, AuthResponse } from '../types';

const router = Router();

// JWT secret key - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Helper function to generate JWT token
function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Helper function to get user by ID (without password hash)
function getUserById(userId: number): Promise<Omit<User, 'password_hash'> | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as Omit<User, 'password_hash'> | null);
        }
      }
    );
  });
}

// POST /api/auth/signup - User registration
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password }: CreateUserRequest = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await new Promise<User | null>((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as User | null);
        }
      );
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Get created user (without password hash)
    const user = await getUserById(userId);
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = generateToken(userId);

    const response: AuthResponse = { user, token };
    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await new Promise<User | null>((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as User | null);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = user;
    const response: AuthResponse = { user: userWithoutPassword, token };
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Get user data
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ user, valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req: Request, res: Response) => {
  // Since we're using JWT tokens, logout is mainly handled on the client side
  // by removing the token from storage. This endpoint is here for completeness
  // and could be extended to implement token blacklisting if needed.
  res.json({ message: 'Logged out successfully' });
});

export { router as authRoutes };

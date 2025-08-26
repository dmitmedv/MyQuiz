import { AuthResponse, LoginRequest, CreateUserRequest, User } from '../types';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

class AuthService {
  // User signup
  async signup(userData: CreateUserRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Signup failed');
    }

    return response.json();
  }

  // User login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    return response.json();
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<{ user: User; valid: boolean }> {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { user: {} as User, valid: false };
    }

    return response.json();
  }

  // User logout (client-side mainly, but calls server for completeness)
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Logout should work even if server call fails
      console.error('Server logout error:', error);
    }
  }
}

export const authService = new AuthService();

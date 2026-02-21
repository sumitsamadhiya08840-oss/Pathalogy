import { LoginCredentials, User, AuthState } from '@/types/auth';

const AUTH_STORAGE_KEY = 'nxa_auth_state';

// Mock user for demonstration
const MOCK_USER: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@nxalab.com',
  role: 'admin',
};

export const authService = {
  // Mock login - in production, this would call an API
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation
    if (credentials.email === 'admin@nxalab.com' && credentials.password === 'admin123') {
      const token = 'mock-jwt-token-' + Date.now();
      return { user: MOCK_USER, token };
    }

    throw new Error('Invalid email or password');
  },

  // Save auth state to localStorage
  saveAuthState: (state: AuthState): void => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  },

  // Load auth state from localStorage
  loadAuthState: (): AuthState | null => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Clear auth state
  clearAuthState: (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Verify token (mock implementation)
  verifyToken: async (token: string): Promise<boolean> => {
    // In production, this would verify with backend
    return token.startsWith('mock-jwt-token-');
  },
};

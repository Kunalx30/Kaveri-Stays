import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getCurrentUserApi, logoutApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kaveri_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('kaveri_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('kaveri_refresh_token'));
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Session restoration on mount:
   * Verifies access token with backend GET /auth/me or relies on refresh interceptor.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('kaveri_access_token');
      if (token) {
        try {
          const liveUser = await getCurrentUserApi();
          setUser(liveUser);
          localStorage.setItem('kaveri_user', JSON.stringify(liveUser));
        } catch {
          // If token verification fails and refresh also failed, state is cleared by interceptor
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        }
      }
      setIsLoading(false);
    };

    restoreSession();

    // Listen for global session expiry events
    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('kaveri_user');
      localStorage.removeItem('kaveri_access_token');
      localStorage.removeItem('kaveri_refresh_token');
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const response = await loginApi({ email, password });
    const { user: userData, tokens } = response;

    setUser(userData);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);

    localStorage.setItem('kaveri_user', JSON.stringify(userData));
    localStorage.setItem('kaveri_access_token', tokens.access_token);
    localStorage.setItem('kaveri_refresh_token', tokens.refresh_token);

    return userData;
  };

  const register = async (registrationData) => {
    const response = await registerApi(registrationData);
    const { user: userData, tokens } = response;

    setUser(userData);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);

    localStorage.setItem('kaveri_user', JSON.stringify(userData));
    localStorage.setItem('kaveri_access_token', tokens.access_token);
    localStorage.setItem('kaveri_refresh_token', tokens.refresh_token);

    return userData;
  };

  const logout = useCallback(async () => {
    const token = localStorage.getItem('kaveri_refresh_token');
    if (token) {
      try {
        await logoutApi(token);
      } catch {
        // Silently ignore logout request network failures
      }
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('kaveri_user');
    localStorage.removeItem('kaveri_access_token');
    localStorage.removeItem('kaveri_refresh_token');
  }, []);

  const refreshUser = async () => {
    try {
      const updatedUser = await getCurrentUserApi();
      setUser(updatedUser);
      localStorage.setItem('kaveri_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(user && accessToken),
    role: user?.role,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

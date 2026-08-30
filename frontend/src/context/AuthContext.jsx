import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kaveri_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('kaveri_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('kaveri_refresh_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('kaveri_access_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('kaveri_user', JSON.stringify(res.data));
        } catch {
          // Token invalid or expired, client interceptor will attempt refresh
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for global logout events from axios interceptor
    const handleGlobalLogout = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };
    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => window.removeEventListener('auth:logout', handleGlobalLogout);
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user: userData, tokens } = response.data;

    setUser(userData);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);

    localStorage.setItem('kaveri_user', JSON.stringify(userData));
    localStorage.setItem('kaveri_access_token', tokens.access_token);
    localStorage.setItem('kaveri_refresh_token', tokens.refresh_token);

    return userData;
  };

  const register = async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    const { user: userData, tokens } = response.data;

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
        await apiClient.post('/auth/logout', { refresh_token: token });
      } catch {
        // Silently ignore logout request failures
      }
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('kaveri_user');
    localStorage.removeItem('kaveri_access_token');
    localStorage.removeItem('kaveri_refresh_token');
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    role: user?.role,
    isLoading,
    login,
    register,
    logout,
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

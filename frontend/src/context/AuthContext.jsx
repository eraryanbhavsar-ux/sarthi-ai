import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sarthi_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('sarthi_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.error || 'Login failed');
  };

  const register = async (name, email, password, preferredLanguage = 'en') => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      preferredLanguage,
    });
    if (res.data.success) {
      localStorage.setItem('sarthi_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.error || 'Registration failed');
  };

  const demoLogin = async () => {
    const res = await api.post('/auth/demo-login');
    if (res.data.success) {
      localStorage.setItem('sarthi_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.error || 'Demo login failed');
  };

  const logout = () => {
    localStorage.removeItem('sarthi_token');
    setToken(null);
    setUser(null);
  };

  const updateUserPreferences = async (preferences) => {
    if (!token) return preferences;
    try {
      const res = await api.put('/auth/preferences', preferences);
      if (res.data.success && user) {
        setUser(prev => ({
          ...prev,
          accessibilityPreferences: { ...prev.accessibilityPreferences, ...preferences },
        }));
      }
      return res.data.preferences;
    } catch (err) {
      console.warn('Could not sync preferences with profile:', err.message);
      return preferences;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        updateUserPreferences,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

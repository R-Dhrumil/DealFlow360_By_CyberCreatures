import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { disconnectSocket } from '../hooks/useSocket';

const AuthContext = createContext(null);

/**
 * Safely parse JSON from localStorage with try/catch.
 * Returns null on any failure (corrupted data, missing key, etc.)
 */
function safeJsonParse(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    localStorage.removeItem(key);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeJsonParse('user'));
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const isAuthenticated = !!(token && user);

  /**
   * Persist auth credentials after successful login/signup.
   * @param {string} newToken - JWT token
   * @param {object} newUser  - User profile object from API
   */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Clear all auth state and redirect to login.
   * Accepts an optional navigate function (for use outside Router context).
   */
  const logout = useCallback((navigateFn) => {
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (navigateFn) navigateFn('/login');
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    login,
    logout,
  }), [user, token, isAuthenticated, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

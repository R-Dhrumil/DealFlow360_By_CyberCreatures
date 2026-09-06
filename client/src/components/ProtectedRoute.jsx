import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, token, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

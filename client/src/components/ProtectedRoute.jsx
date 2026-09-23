import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { isTokenExpired } from '../utils/isTokenExpired';

export default function ProtectedRoute({ children }) {
  const { token, logout } = useContext(AuthContext);

  if (!token || isTokenExpired(token)) {
    if (token) logout();
    return <Navigate to="/login" replace />;
  }

  return children;
}
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
      const savedUser = sessionStorage.getItem('user');
      // Fallback in case token exists but user object doesn't
      setUser(savedUser ? JSON.parse(savedUser) : { isAuthenticated: true });
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  }, [token]);

  const login = (newToken, userObj) => {
    setToken(newToken);
    setUser(userObj);
    sessionStorage.setItem('user', JSON.stringify(userObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
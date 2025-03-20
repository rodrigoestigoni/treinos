import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/v1/users/me/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (err) {
          // Token inválido ou expirado
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/token/', { email, password });
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      
      // Buscar dados do usuário
      const userResponse = await axios.get('/api/v1/users/me/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      setUser(userResponse.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/v1/users/', userData);
      return true;
    } catch (err) {
      setError(err.response?.data || 'Erro ao registrar.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        token,
        login,
        logout,
        register,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
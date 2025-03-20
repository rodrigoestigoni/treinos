// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação quando o componente é montado
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/me/');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Erro de autenticação:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/token/', { email, password });
      const { access, refresh } = response.data;
      
      // Salvar tokens
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      
      // Buscar dados do usuário
      const userResponse = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      
      setUser(userResponse.data);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
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
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/users/', userData);
      return true;
    } catch (err) {
      console.error('Erro ao registrar:', err);
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
        isAuthenticated,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
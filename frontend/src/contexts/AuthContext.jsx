// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Determinar baseURL com base no ambiente
  const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8550/api/v1'
    : '/api/v1';

  // Verificar autenticação quando o componente é montado
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${apiBaseUrl}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
  }, [token, apiBaseUrl]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/token/`, { email, password });
      const { access, refresh } = response.data;
      
      // Salvar tokens
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      
      // Buscar dados do usuário
      const userResponse = await axios.get(`${apiBaseUrl}/users/me/`, {
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
      await axios.post(`${apiBaseUrl}/users/`, userData);
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
        register,
        apiBaseUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
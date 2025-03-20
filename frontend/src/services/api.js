// src/services/api.js
import axios from 'axios';

// Interceptor de logs para depuração
api.interceptors.request.use(request => {
    console.log('Iniciando requisição:', request.method.toUpperCase(), request.url);
    return request;
  }, error => {
    console.error('Erro ao fazer requisição:', error);
    return Promise.reject(error);
  });
  
  api.interceptors.response.use(response => {
    console.log('Resposta recebida:', response.status, response.config.url);
    return response;
  }, error => {
    if (error.response) {
      // Resposta do servidor fora do range 2xx
      console.error('Erro de resposta:', error.response.status, error.response.config.url);
      console.error('Dados do erro:', error.response.data);
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('Sem resposta para:', error.config.url);
    } else {
      // Erro na configuração da requisição
      console.error('Erro de configuração:', error.message);
    }
    return Promise.reject(error);
  });

// Determinar baseURL com base no ambiente
const apiBaseUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:8550/api/v1'
  : '/api/v1';

// Cria uma instância do axios com a URL base da API
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros nas respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Se o erro for 401 (Unauthorized), redireciona para a página de login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
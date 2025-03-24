// frontend/src/contexts/ExerciseContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Criar o contexto
const ExerciseContext = createContext();

// Hook para usar o contexto
export const useExercises = () => useContext(ExerciseContext);

export const ExerciseProvider = ({ children }) => {
  const { token, apiBaseUrl } = useAuth();
  const { errorToast } = useToast();
  
  const [exercises, setExercises] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });

  // Configuração de cabeçalhos para requisições
  const getHeaders = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, [token]);

  // Buscar exercícios com paginação
  const fetchExercises = useCallback(async (page = 1) => {
    if (!token) return;
    
    setLoading(true);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/exercises/?page=${page}`, getHeaders());
      const { results, count, next, previous } = response.data;
      
      setExercises(results || []);
      setPaginationInfo({
        count,
        next,
        previous,
        currentPage: page
      });
      
      return results;
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      errorToast('Erro ao carregar exercícios');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast]);

  // Buscar todos os exercícios (para cenários como criação de treinos)
  const fetchAllExercises = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    
    try {
      let allResults = [];
      let nextUrl = `${apiBaseUrl}/exercises/`;
      
      // Fazer requisições para todas as páginas
      while (nextUrl) {
        const response = await axios.get(nextUrl, getHeaders());
        const { results, next } = response.data;
        
        allResults = [...allResults, ...results];
        nextUrl = next;
      }
      
      setAllExercises(allResults);
      return allResults;
    } catch (error) {
      console.error('Erro ao buscar todos os exercícios:', error);
      errorToast('Erro ao carregar exercícios');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast]);

  // Obter exercício por ID
  const getExerciseById = useCallback(async (id) => {
    if (!token) return null;
    
    setLoading(true);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/exercises/${id}/`, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar exercício:', error);
      errorToast('Exercício não encontrado');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast]);

  // Criar exercício
  const createExercise = useCallback(async (exerciseData) => {
    if (!token) return null;
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/exercises/`, exerciseData, {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Atualizar lista de exercícios
      await fetchExercises();
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar exercício:', error);
      errorToast('Erro ao criar exercício');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast, fetchExercises]);

  // Atualizar exercício
  const updateExercise = useCallback(async (id, exerciseData) => {
    if (!token) return null;
    
    setLoading(true);
    
    try {
      const response = await axios.patch(`${apiBaseUrl}/exercises/${id}/`, exerciseData, {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Atualizar lista de exercícios
      await fetchExercises();
      
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      errorToast('Erro ao atualizar exercício');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast, fetchExercises]);

  // Excluir exercício
  const deleteExercise = useCallback(async (id) => {
    if (!token) return false;
    
    setLoading(true);
    
    try {
      await axios.delete(`${apiBaseUrl}/exercises/${id}/`, getHeaders());
      
      // Atualizar lista de exercícios
      await fetchExercises();
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      errorToast('Erro ao excluir exercício');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, getHeaders, errorToast, fetchExercises]);

  // Navegar para a próxima página
  const nextPage = useCallback(() => {
    if (paginationInfo.next) {
      fetchExercises(paginationInfo.currentPage + 1);
    }
  }, [paginationInfo, fetchExercises]);

  // Navegar para a página anterior
  const previousPage = useCallback(() => {
    if (paginationInfo.previous) {
      fetchExercises(paginationInfo.currentPage - 1);
    }
  }, [paginationInfo, fetchExercises]);

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        allExercises,
        loading,
        paginationInfo,
        fetchExercises,
        fetchAllExercises,
        getExerciseById,
        createExercise,
        updateExercise,
        deleteExercise,
        nextPage,
        previousPage
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};
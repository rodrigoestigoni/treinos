// src/contexts/WorkoutContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WorkoutContext = createContext();

export const useWorkout = () => useContext(WorkoutContext);

export const WorkoutProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { errorToast } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Definir a base URL para APIs
  const apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8550/api/v1' 
    : '/api/v1';

  // Configuração de cabeçalhos para requisições
  const getHeaders = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, [token]);

  // Função memoizada para buscar treinos
  const fetchWorkouts = useCallback(async () => {
    if (!isAuthenticated || !token) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiBaseUrl}/workouts/`, getHeaders());
      const fetchedWorkouts = response.data.results || response.data;
      setWorkouts(fetchedWorkouts);
      return fetchedWorkouts;
    } catch (err) {
      console.error('Erro ao buscar treinos:', err);
      setError('Erro ao carregar treinos.');
      errorToast('Não foi possível carregar seus treinos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, errorToast, getHeaders, apiBaseUrl]);

  // Carregar treinos apenas uma vez na inicialização
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      fetchWorkouts();
      setIsInitialized(true);
    }
  }, [isAuthenticated, isInitialized, fetchWorkouts]);

  const getWorkoutById = async (id) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usando axios diretamente com URL absoluta para depuração
      console.log("Requesting workout with ID:", id);
      console.log("API URL:", `${apiBaseUrl}/workouts/${id}/`);
      
      const response = await axios.get(`${apiBaseUrl}/workouts/${id}/`, getHeaders());
      console.log("Response status:", response.status);
      return response.data;
    } catch (err) {
      console.error('Erro ao carregar treino:', err);
      // Verificar o tipo de erro
      if (err.response) {
        // O servidor respondeu com um status fora do intervalo 2xx
        console.error('Status do erro:', err.response.status);
        console.error('Dados do erro:', err.response.data);
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Sem resposta do servidor');
      } else {
        // Algo aconteceu na configuração da requisição
        console.error('Erro de configuração:', err.message);
      }
      
      setError('Erro ao carregar treino.');
      errorToast('Não foi possível carregar o treino');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async (workoutData) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/workouts/`, workoutData, getHeaders());
      // Atualiza a lista de treinos após criar um novo
      await fetchWorkouts();
      return response.data;
    } catch (err) {
      console.error('Erro ao criar treino:', err);
      setError('Erro ao criar treino.');
      errorToast('Não foi possível criar o treino');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkout = async (id, workoutData) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.patch(`${apiBaseUrl}/workouts/${id}/`, workoutData, getHeaders());
      // Atualiza a lista de treinos após atualizar
      await fetchWorkouts();
      return response.data;
    } catch (err) {
      console.error('Erro ao atualizar treino:', err);
      setError('Erro ao atualizar treino.');
      errorToast('Não foi possível atualizar o treino');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id) => {
    if (!isAuthenticated || !token) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${apiBaseUrl}/workouts/${id}/`, getHeaders());
      // Atualiza a lista de treinos após deletar
      await fetchWorkouts();
      return true;
    } catch (err) {
      console.error('Erro ao excluir treino:', err);
      setError('Erro ao excluir treino.');
      errorToast('Não foi possível excluir o treino');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async (workoutId) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/workout-sessions/`, {
        workout: workoutId
      }, getHeaders());
      setActiveWorkout(response.data);
      return response.data;
    } catch (err) {
      console.error('Erro ao iniciar treino:', err);
      setError('Erro ao iniciar treino.');
      errorToast('Não foi possível iniciar o treino');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseProgress = async (sessionId, exerciseId, setNumber, repsCompleted, weight = null) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/exercise-logs/`, {
        session: sessionId,
        workout_exercise: exerciseId,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight: weight
      }, getHeaders());
      return response.data;
    } catch (err) {
      console.error('Erro ao salvar progresso do exercício:', err);
      setError('Erro ao salvar progresso do exercício.');
      errorToast('Não foi possível registrar o progresso');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeWorkout = async (sessionId) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/workout-sessions/${sessionId}/complete/`, {}, getHeaders());
      setActiveWorkout(null);
      return response.data;
    } catch (err) {
      console.error('Erro ao completar treino:', err);
      setError('Erro ao completar treino.');
      errorToast('Não foi possível finalizar o treino');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        activeWorkout,
        loading,
        error,
        fetchWorkouts,
        getWorkoutById,
        createWorkout,
        updateWorkout,
        deleteWorkout,
        startWorkout,
        updateExerciseProgress,
        completeWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
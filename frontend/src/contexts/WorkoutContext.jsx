// frontend/src/contexts/WorkoutContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WorkoutContext = createContext();

export const useWorkout = () => useContext(WorkoutContext);

export const WorkoutProvider = ({ children }) => {
  const { token, isAuthenticated, apiBaseUrl } = useAuth();
  const { errorToast } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
  // Dependências corretas e estáveis
  }, [isAuthenticated, token, apiBaseUrl, getHeaders, errorToast]);

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
      const response = await axios.get(`${apiBaseUrl}/workouts/${id}/`, getHeaders());
      return response.data;
    } catch (err) {
      console.error('Erro ao carregar treino:', err);
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
      const response = await axios.post(`${apiBaseUrl}/workouts/${workoutId}/start_session/`, {}, getHeaders());
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

  const recordExerciseSet = async (sessionId, exerciseId, setNumber, actualReps, weight = null, timeTaken = null) => {
    if (!isAuthenticated || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/workout-sessions/${sessionId}/record_set/`, {
        exercise_id: exerciseId,
        set_number: setNumber,
        actual_reps: actualReps,
        weight: weight,
        time_taken: timeTaken
      }, getHeaders());
      
      return response.data;
    } catch (err) {
      console.error('Erro ao salvar série:', err);
      setError('Erro ao salvar progresso do exercício.');
      errorToast('Não foi possível registrar a série');
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
        recordExerciseSet,
        completeWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
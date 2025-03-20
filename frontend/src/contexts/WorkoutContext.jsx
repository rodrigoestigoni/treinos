// src/contexts/WorkoutContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
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

  // Função memoizada para buscar treinos
  const fetchWorkouts = useCallback(async () => {
    if (!isAuthenticated || !token) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/workouts/');
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
  }, [token, isAuthenticated, errorToast]);

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
      const response = await api.get(`/workouts/${id}/`);
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
      const response = await api.post('/workouts/', workoutData);
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
      const response = await api.patch(`/workouts/${id}/`, workoutData);
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
      await api.delete(`/workouts/${id}/`);
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
      const response = await api.post('/workout-sessions/', {
        workout: workoutId
      });
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
      const response = await api.post('/exercise-logs/', {
        session: sessionId,
        workout_exercise: exerciseId,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight: weight
      });
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
      const response = await api.post(`/workout-sessions/${sessionId}/complete/`, {});
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
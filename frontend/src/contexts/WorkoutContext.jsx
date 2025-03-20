import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WorkoutContext = createContext();

export const useWorkout = () => useContext(WorkoutContext);

export const WorkoutProvider = ({ children }) => {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchWorkouts = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/workouts/', { headers });
      setWorkouts(response.data.results || response.data);
      return response.data.results || response.data;
    } catch (err) {
      setError('Erro ao carregar treinos.');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutById = async (id) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/workouts/${id}/`, { headers });
      return response.data;
    } catch (err) {
      setError('Erro ao carregar treino.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async (workoutData) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/workouts/', workoutData, { headers });
      await fetchWorkouts(); // Atualizar lista de treinos
      return response.data;
    } catch (err) {
      setError('Erro ao criar treino.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkout = async (id, workoutData) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`/api/v1/workouts/${id}/`, workoutData, { headers });
      await fetchWorkouts(); // Atualizar lista de treinos
      return response.data;
    } catch (err) {
      setError('Erro ao atualizar treino.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id) => {
    if (!token) return false;
    
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/v1/workouts/${id}/`, { headers });
      await fetchWorkouts(); // Atualizar lista de treinos
      return true;
    } catch (err) {
      setError('Erro ao excluir treino.');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async (workoutId) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/workout-sessions/', {
        workout: workoutId
      }, { headers });
      setActiveWorkout(response.data);
      return response.data;
    } catch (err) {
      setError('Erro ao iniciar treino.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseProgress = async (sessionId, exerciseId, setNumber, repsCompleted, weight = null) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/exercise-logs/', {
        session: sessionId,
        workout_exercise: exerciseId,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight: weight
      }, { headers });
      return response.data;
    } catch (err) {
      setError('Erro ao salvar progresso do exercício.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeWorkout = async (sessionId, exerciseProgress) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/v1/workout-sessions/${sessionId}/complete/`, {}, { headers });
      setActiveWorkout(null);
      return response.data;
    } catch (err) {
      setError('Erro ao completar treino.');
      console.error(err);
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
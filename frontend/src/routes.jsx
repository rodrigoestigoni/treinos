import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Páginas públicas
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Páginas protegidas
import Home from './pages/Home';
import Profile from './pages/Profile';
import Progress from './pages/Progress';

// Treinos
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import WorkoutForm from './pages/WorkoutForm';
import ActiveWorkout from './pages/ActiveWorkout';
import WorkoutSummary from './pages/WorkoutSummary';

// Exercícios
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import ExerciseForm from './pages/ExerciseForm';
import MuscleGroups from './pages/MuscleGroups';

// Wrapper de página privada
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente principal de rotas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rotas privadas */}
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } 
      />
      
      {/* Rotas de exercícios */}
      <Route 
        path="/exercises" 
        element={
          <PrivateRoute>
            <Exercises />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/exercises/create" 
        element={
          <PrivateRoute>
            <ExerciseForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/exercises/:exerciseId" 
        element={
          <PrivateRoute>
            <ExerciseDetail />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/exercises/edit/:exerciseId" 
        element={
          <PrivateRoute>
            <ExerciseForm />
          </PrivateRoute>
        } 
      />
      
      {/* Rota para gerenciar grupos musculares */}
      <Route 
        path="/muscle-groups" 
        element={
          <PrivateRoute>
            <MuscleGroups />
          </PrivateRoute>
        } 
      />
      
      {/* Rotas de treinos */}
      <Route 
        path="/workouts" 
        element={
          <PrivateRoute>
            <Workouts />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/workouts/create" 
        element={
          <PrivateRoute>
            <WorkoutForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/workouts/edit/:workoutId" 
        element={
          <PrivateRoute>
            <WorkoutForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/workouts/active/:workoutId" 
        element={
          <PrivateRoute>
            <ActiveWorkout />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/workouts/summary" 
        element={
          <PrivateRoute>
            <WorkoutSummary />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/workouts/:workoutId" 
        element={
          <PrivateRoute>
            <WorkoutDetail />
          </PrivateRoute>
        } 
      />
      
      {/* Outras rotas */}
      <Route 
        path="/progress" 
        element={
          <PrivateRoute>
            <Progress />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } 
      />
      
      {/* Rota 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
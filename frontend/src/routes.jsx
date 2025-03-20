// src/routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importe os componentes diretamente em vez de usar lazy loading inicialmente
// para depuração dos problemas de rota
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import ActiveWorkout from './pages/ActiveWorkout';
import WorkoutSummary from './pages/WorkoutSummary';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

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
      <Route 
        path="/workouts" 
        element={
          <PrivateRoute>
            <Workouts />
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
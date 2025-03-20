import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importação preguiçosa das páginas para melhorar o desempenho
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Home = React.lazy(() => import('./pages/Home'));
const Workouts = React.lazy(() => import('./pages/Workouts'));
const WorkoutDetail = React.lazy(() => import('./pages/WorkoutDetail'));
const ActiveWorkout = React.lazy(() => import('./pages/ActiveWorkout'));
const WorkoutSummary = React.lazy(() => import('./pages/WorkoutSummary'));
const Progress = React.lazy(() => import('./pages/Progress'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

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
    <React.Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      }
    >
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
    </React.Suspense>
  );
};

export default AppRoutes;
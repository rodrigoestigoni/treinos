// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  // Configurar o URL base do axios para toda a aplicação
  const apiUrl = process.env.REACT_APP_API_URL || '/api/v1';
  console.log("API URL:", apiUrl);

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <AuthProvider>
            <ToastProvider>
              <WorkoutProvider>
                <AppRoutes />
                <Toast />
              </WorkoutProvider>
            </ToastProvider>
          </AuthProvider>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
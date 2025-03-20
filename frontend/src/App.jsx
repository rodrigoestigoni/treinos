import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/common/Toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WorkoutProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <AppRoutes />
              <Toast />
            </div>
          </ToastProvider>
        </WorkoutProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
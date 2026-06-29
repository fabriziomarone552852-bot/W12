// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TasksPage from '../views/TasksPage';
import EventsPage from '../views/EventsPage';
import CategoriesPage from '../views/CategoriesPage';
import LoginScreen from '../views/LoginScreen';
import { useAuth } from '../context/AuthContext';
import AppShellLayout from '../components/AppShellLayout';

const AppRouter: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        // ramo autenticato: layout completo con sidebar + pagine protette
        <AppShellLayout onLogout={logout}>
          <Routes>
            {/* redirect root → /tasks */}
            <Route path="/" element={<Navigate to="/tasks" replace />} />

            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />

            {/* fallback: qualsiasi altra route → /tasks */}
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </AppShellLayout>
      ) : (
        // ramo non autenticato: solo login/registrazione
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          {/* qualsiasi altro percorso porta comunque al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default AppRouter;
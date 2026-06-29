// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importiamo le pagine
import HomePage from '../views/HomePage';
import TasksPage from '../views/TasksPage';
import EventsPage from '../views/EventsPage';
import CategoriesPage from '../views/CategoriesPage';
import LoginScreen from '../views/LoginScreen';

// Importiamo il Layout
import AppShellLayout from '../components/AppShellLayout';

const AppRouter: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        // Ramo Autenticato
        <Routes>
          {/* Usiamo una rotta "wrapper" per applicare il Layout a tutte le pagine interne */}
          <Route element={<AppShellLayout onLogout={logout} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      ) : (
        // Ramo Non Autenticato
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default AppRouter;
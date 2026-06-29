// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pagine
import HomePage from '../views/HomePage';
import TasksPage from '../views/TasksPage';
import EventsPage from '../views/EventsPage';
import CategoriesPage from '../views/CategoriesPage';
import CategoryEditPage from '../views/CategoryEditPage';
import LoginScreen from '../views/LoginScreen';

// Layout
import AppShellLayout from '../components/AppShellLayout';

const AppRouter: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <AppShellLayout onLogout={logout}>
          <Routes>
            {/* Landing dopo login: HomePage */}
            <Route path="/" element={<HomePage />} />

            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route
              path="/categories/:id/edit"
              element={<CategoryEditPage />}
            />

            {/* fallback autenticato: qualsiasi altra route → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShellLayout>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default AppRouter;
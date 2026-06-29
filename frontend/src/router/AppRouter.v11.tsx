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
import UserSettingsPage from '../views/UserSettingsPage'; // ⬅️ nuovo import
import LoginScreen from '../views/LoginScreen';
import ShoppingPage from "../views/ShoppingPage";

// Layout
import AppShellLayout from '../components/AppShellLayout';

const AppRouter: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <Routes>
          {/* Layout genitore con Outlet */}
          <Route element={<AppShellLayout onLogout={logout} />}>
            {/* Landing dopo login: HomePage */}
            <Route path="/" element={<HomePage />} />

            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
			<Route path="/shopping" element={<ShoppingPage />} />
            <Route
              path="/categories/:id/edit"
              element={<CategoryEditPage />}
            />
            <Route path="/settings" element={<UserSettingsPage />} /> {/* ⬅️ nuova route */}

            {/* fallback autenticato: qualsiasi altra route → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
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
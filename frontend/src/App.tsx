import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { TasksProvider } from './context/TasksContext';
import { EventsProvider } from './context/EventsContext';
import { DayProvider } from './context/DayContext';
import { CategoriesProvider } from './context/CategoriesContext';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <TasksProvider>
          <EventsProvider>
            <DayProvider>
              <AppRouter />
            </DayProvider>
          </EventsProvider>
        </TasksProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
};

export default App;
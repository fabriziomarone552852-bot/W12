import { AuthProvider } from '@/context/AuthContext';
import AppRouter from '@/router/AppRouter';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { DayProvider } from '@/context/DayContext';
import { TaskModalProvider } from '@/context/TaskModalContext';
import { EventModalProvider } from '@/context/EventModalContext';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <DayProvider>
          {/* 🪄 Inseriamo il nuovo provider qui */}
          <EventModalProvider>
            <TaskModalProvider>
              
              <AppRouter />
              
            </TaskModalProvider>
          </EventModalProvider>
        </DayProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
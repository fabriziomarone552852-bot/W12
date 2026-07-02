import { AuthProvider } from '@/context/AuthContext';
import AppRouter from '@/router/AppRouter';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { DayProvider } from '@/context/DayContext';
import { TaskModalProvider } from '@/context/TaskModalContext';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <DayProvider>
          <TaskModalProvider>
            <AppRouter />
          </TaskModalProvider>
        </DayProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
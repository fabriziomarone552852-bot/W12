import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { ConfirmProvider } from './context/ConfirmContext';
import { DayProvider } from './context/DayContext'; 

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <DayProvider>
          <AppRouter />
        </DayProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { ConfirmProvider } from './context/ConfirmContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayProvider } from './context/DayContext'; // 🪄 1. DEVI IMPORTARLO!

// 1. Creiamo l'istanza del QueryClient (Il nuovo motore)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // I dati rimangono "freschi" per 5 minuti
      refetchOnWindowFocus: true, // Ricarica in automatico se l'utente cambia tab e torna
    },
  },
});

function App() {
  return (
    // 2. Montiamo il motore all'esterno di tutto!
    <QueryClientProvider client={queryClient}>
      
      <AuthProvider>
        <ConfirmProvider>
          
          <DayProvider> {/* 🪄 2. DEVE AVVOLGERE IL ROUTER! */}
            
            {/* Il router gestirà le pagine, e le pagine useranno gli hook! */}
            <AppRouter />
            
          </DayProvider>

        </ConfirmProvider>
      </AuthProvider>

    </QueryClientProvider>
  );
}

export default App;
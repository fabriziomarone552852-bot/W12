import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { ConfirmProvider } from './context/ConfirmContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      
      {/* 3. Manteniamo solo i provider di base per Utente e Modali */}
      <AuthProvider>
        <ConfirmProvider>
          
          {/* 4. Il router gestirà le pagine, e le pagine useranno gli hook! */}
          <AppRouter />
          
        </ConfirmProvider>
      </AuthProvider>

    </QueryClientProvider>
  );
}

export default App;
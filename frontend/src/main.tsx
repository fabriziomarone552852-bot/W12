// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Importiamo React Query e i DevTools
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 2. Creiamo l'istanza del client FUORI dalla funzione per non ricrearla mai
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Sincronizzazione perfetta tra dispositivi/tab
      staleTime: 1000 * 60 * 5,   // 5 minuti di RAM fresca
      retry: 1,                   // Fail-fast in caso di errori
    },
  },
});

// 3. Manteniamo la TUA logica di bootstrap vitale!
async function bootstrap() {
  try {
    const response = await fetch('/config.json');
    const config = await response.json();

    // Espone la config globalmente
    (window as any).APP_CONFIG = config;

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        {/* 4. Avvolgiamo l'App nel Provider DENTRO il render */}
        <QueryClientProvider client={queryClient}>
          
          <App />
          
          {/* I DevTools scompariranno automaticamente in produzione */}
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          
        </QueryClientProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Errore nel caricamento di config.json:', error);
    document.body.innerHTML =
      '<h2>Errore: impossibile caricare la configurazione dell\'app.</h2>';
  }
}

bootstrap();
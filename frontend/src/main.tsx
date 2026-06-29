import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function bootstrap() {
  try {
    const response = await fetch('/config.json');
    const config = await response.json();

    // Espone la config globalmente
    (window as any).APP_CONFIG = config;

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Errore nel caricamento di config.json:', error);
    document.body.innerHTML =
      '<h2>Errore: impossibile caricare la configurazione dell\'app.</h2>';
  }
}

bootstrap();
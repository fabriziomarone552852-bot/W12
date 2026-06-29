import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
  // Tutta la logica intatta dal codice di tuo padre
  const { login, register, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect automatico se già autenticato o dopo login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      // niente navigate qui: ci pensa l'useEffect
    } catch {
      // error già gestito nel context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        
        {/* Intestazione */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {mode === 'login' ? 'Bentornato' : 'Crea un Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {mode === 'login' 
              ? 'Inserisci le tue credenziali per accedere' 
              : 'Unisciti per organizzare la tua vita'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* Campo Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Username</label>
            <div className="mt-1">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Username"
              />
            </div>
          </div>

          {/* Campo Email (Solo Registrazione) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email"
                />
              </div>
            </div>
          )}

          {/* Campo Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <div className="mt-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Messaggio di Errore dal Context */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Bottone Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                loading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900'
              }`}
            >
              {loading ? 'Attendere...' : mode === 'login' ? 'Entra' : 'Registrati'}
            </button>
          </div>
        </form>

        {/* Switch Login / Register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm font-medium text-blue-500 hover:text-blue-400 focus:outline-none transition-colors"
          >
            {mode === 'login'
              ? 'Non hai un account? Registrati ora'
              : 'Hai già un account? Vai al login'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
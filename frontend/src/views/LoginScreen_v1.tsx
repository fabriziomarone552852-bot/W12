import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const containerStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: '2rem auto',
  padding: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '0.75rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  borderRadius: 4,
  border: '1px solid #ccc',
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: 4,
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer',
};

const toggleStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  fontSize: 13,
  color: '#2563eb',
  cursor: 'pointer',
  textAlign: 'center',
};

const errorStyle: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: 13,
  marginBottom: '0.5rem',
};

const LoginScreen: React.FC = () => {
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
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>
        {mode === 'login' ? 'Login' : 'Registrazione'}
      </h2>

      <form onSubmit={onSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Username</label>
          <input
            style={inputStyle}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {mode === 'register' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Attendere...' : mode === 'login' ? 'Entra' : 'Registrati'}
        </button>
      </form>

      <div
        style={toggleStyle}
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login'
          ? 'Non hai un account? Registrati'
          : 'Hai già un account? Vai al login'}
      </div>
    </div>
  );
};

export default LoginScreen;
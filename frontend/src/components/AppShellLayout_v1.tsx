// src/components/AppShellLayout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppShellLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const headerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #ddd',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
};

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: 'calc(100vh - 56px)',
};

const sidebarStyle: React.CSSProperties = {
  width: 200,
  borderRight: '1px solid #ddd',
  backgroundColor: '#fafafa',
  padding: '0.75rem',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '1rem',
};

const menuLinkStyle = (active: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '0.35rem 0.5rem',
  borderRadius: 4,
  textDecoration: 'none',
  color: active ? '#fff' : '#111827',
  backgroundColor: active ? '#2563eb' : 'transparent',
  fontSize: 14,
  marginBottom: 4,
});

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Smart Agenda (React)</h1>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              border: '1px solid #ccc',
              background: '#fff',
              padding: '0.25rem 0.75rem',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Logout
          </button>
        )}
      </header>

      <div style={layoutStyle}>
        {onLogout && (
          <aside style={sidebarStyle}>
            <nav>
              <Link
                to="/"
                style={menuLinkStyle(location.pathname === '/')}
              >
                Dashboard
              </Link>

              <Link
                to="/tasks"
                style={menuLinkStyle(location.pathname === '/tasks')}
              >
                Tasks
              </Link>

              <Link
                to="/events"
                style={menuLinkStyle(location.pathname === '/events')}
              >
                Eventi
              </Link>

              <Link
                to="/categories"
                style={menuLinkStyle(location.pathname === '/categories')}
              >
                Categorie
              </Link>

              {/* in futuro: /shopping, /impostazioni, ecc. */}
            </nav>
          </aside>
        )}
        <main style={mainStyle}>{children}</main>
      </div>
    </div>
  );
};

export default AppShellLayout;
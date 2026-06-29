import React, { useMemo } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AppShellLayoutProps {
  onLogout?: () => void;
}

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  const displayUsername = user?.username ? user.username.toUpperCase() : 'OSPITE';

  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const elapsed = now.getTime() - startOfYear.getTime();
    const total = endOfYear.getTime() - startOfYear.getTime();
    return Math.floor((elapsed / total) * 100);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Benvenuto
          </h2>
          <h1 className="text-3xl font-extrabold text-white mt-1 truncate">
            {displayUsername}
          </h1>
        </div>

        <nav className="sidebar-nav">
          <div className="mb-6 space-y-1">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            >
              Agenda
            </Link>
            <Link
              to="/free-time"
              className={`nav-link ${
                isActive('/free-time') ? 'nav-link-active' : ''
              }`}
            >
              Free Time
            </Link>
            <Link
              to="/universita"
              className={`nav-link ${
                isActive('/universita') ? 'nav-link-active' : ''
              }`}
            >
              Università
            </Link>
            <Link
              to="/shopping"
              className={`nav-link ${
                isActive('/shopping') ? 'nav-link-active' : ''
              }`}
            >
              Shopping
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-800 space-y-1">
            <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Menu Sviluppo
            </p>
            <Link
              to="/tasks"
              className={`nav-link ${isActive('/tasks') ? 'nav-link-active' : ''}`}
            >
              Lista Tasks
            </Link>
            <Link
              to="/events"
              className={`nav-link ${
                isActive('/events') ? 'nav-link-active' : ''
              }`}
            >
              Lista Eventi
            </Link>
            <Link
              to="/categories"
              className={`nav-link ${
                isActive('/categories') ? 'nav-link-active' : ''
              }`}
            >
              Gestione Categorie
            </Link>
          </div>
        </nav>

{/*
		<div className="sidebar-footer">
			<Link
				to="/settings"
				className={`btn-icon ${location.pathname === '/settings' ? 'btn-icon-active' : ''}`}
				style={{ marginRight: 8 }}
				aria-label="Impostazioni"
			>
				⚙
			</Link>
			<button onClick={onLogout} className="btn-logout">
				Esci
			</button>
		</div>
*/}

		<div className="sidebar-footer">
			<Link
			  to="/settings"
				className={`btn-icon ${isActive('/settings') ? 'btn-icon-active' : ''}`}
				style={{ marginRight: 8 }}
				aria-label="Impostazioni"
			>
				⚙ 
			</Link>
			<button onClick={onLogout} className="btn-logout">
				Esci
			</button>
		</div>
      </aside>

      {/* AREA PRINCIPALE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="main-header">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight w-1/4">
            Dashboard
          </h2>

          <div className="progress-container">
            <div className="progress-label-wrap">
              <span>Progressione dell&apos;Anno</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${yearProgress}%` }}
              >
                <span className="text-sm font-bold text-white drop-shadow-md">
                  {yearProgress}%
                </span>
              </div>
            </div>
          </div>

          <div className="w-1/4"></div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShellLayout;
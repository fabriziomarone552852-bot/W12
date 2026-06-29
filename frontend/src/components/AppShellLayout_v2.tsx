// src/components/AppShellLayout.tsx
import React, { useMemo } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

interface AppShellLayoutProps {
  onLogout?: () => void;
}

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ onLogout }) => {
  const location = useLocation();

  // Calcolo dinamico della percentuale dell'anno trascorso
  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const elapsed = now.getTime() - startOfYear.getTime();
    const total = endOfYear.getTime() - startOfYear.getTime();
    return Math.floor((elapsed / total) * 100);
  }, []);

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `block px-4 py-3 rounded-lg transition-colors font-medium ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800 flex-shrink-0 z-10 shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Benvenuto</h2>
          <h1 className="text-3xl font-extrabold text-white mt-1 truncate">FABRIZIO</h1>
          <p className="text-xs text-blue-400 italic mt-1 font-medium">"Signore delle Pestilenze"</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/" className={getLinkClassName('/')}>Agenda (Home)</Link>
          <Link to="/tasks" className={getLinkClassName('/tasks')}>Tasks</Link>
          <Link to="/events" className={getLinkClassName('/events')}>Eventi</Link>
          <Link to="/categories" className={getLinkClassName('/categories')}>Categorie</Link>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-red-900/30">
            Esci
          </button>
        </div>
      </aside>

      {/* AREA PRINCIPALE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-0">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Dashboard</h2>
          
          {/* BARRA PROGRESSIONE DINAMICA */}
          <div className="w-64">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
              <span>PROGRESSIONE ANNO</span>
              <span className="text-green-600">{yearProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${yearProgress}%` }}></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 relative">
          {/* Outlet inietta qui la pagina corrente (es. HomePage) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShellLayout;
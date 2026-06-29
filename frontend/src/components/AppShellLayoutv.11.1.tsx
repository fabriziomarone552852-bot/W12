import React, { useMemo, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AppShellLayoutProps {
  onLogout?: () => void;
}

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Questa nuova "memoria" ricorda se il mouse si trova sopra il menu Agenda
  const [isAgendaHovered, setIsAgendaHovered] = useState(false);

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

  // L'Agenda è "attiva" se siamo sulla home o in una delle sue sottosezioni
  const isAgendaActive = isActive('/') || isActive('/oggi') || isActive('/settimana') || isActive('/mese');

  return (
    <div className="app-container flex h-screen overflow-hidden relative">
      
      {/* SIDEBAR ESTERNA */}
      <aside 
        className={`sidebar fixed xl:static top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out shrink-0 overflow-hidden
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 xl:w-0'}`}
      >
        <div className="w-64 min-w-[16rem] h-full flex flex-col">
          
          <div className="sidebar-header flex justify-between items-start">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Benvenuto
              </h2>
              <h1 className="text-3xl font-extrabold text-white mt-1 truncate">
                {displayUsername}
              </h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="xl:hidden text-gray-400 hover:text-white mt-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="sidebar-nav flex-1">
            <div className="mb-6 space-y-1">
              
              {/* CONTENITORE AGENDA: Rileva quando il mouse entra ed esce */}
              <div 
                onMouseEnter={() => setIsAgendaHovered(true)} 
                onMouseLeave={() => setIsAgendaHovered(false)}
                className="flex flex-col"
              >
                <Link
                  to="/"
                  className={`nav-link ${isAgendaActive ? 'nav-link-active' : ''}`}
                >
                  Agenda
                </Link>

                {/* Mostra il sottomenu se siamo in una pagina dell'Agenda OPPURE se ci passiamo sopra col mouse */}
                {(isAgendaActive || isAgendaHovered) && (
                  <div className="flex flex-col space-y-1 mt-1 mb-2">
                    <Link
                      to="/oggi"
                      className={`nav-link pl-10 text-sm py-1.5 ${isActive('/oggi') ? 'text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Oggi
                    </Link>
                    <Link
                      to="/settimana"
                      className={`nav-link pl-10 text-sm py-1.5 ${isActive('/settimana') ? 'text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Settimana
                    </Link>
                    <Link
                      to="/mese"
                      className={`nav-link pl-10 text-sm py-1.5 ${isActive('/mese') ? 'text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Mese
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/free-time"
                className={`nav-link ${isActive('/free-time') ? 'nav-link-active' : ''}`}
              >
                Free Time
              </Link>
              <Link
                to="/universita"
                className={`nav-link ${isActive('/universita') ? 'nav-link-active' : ''}`}
              >
                Università
              </Link>
              <Link
                to="/shopping"
                className={`nav-link ${isActive('/shopping') ? 'nav-link-active' : ''}`}
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
                className={`nav-link ${isActive('/events') ? 'nav-link-active' : ''}`}
              >
                Lista Eventi
              </Link>
              <Link
                to="/categories"
                className={`nav-link ${isActive('/categories') ? 'nav-link-active' : ''}`}
              >
                Gestione Categorie
              </Link>
            </div>
          </nav>

          <div className="sidebar-footer flex items-center justify-between mt-auto">
            <Link
              to="/settings"
              className={`btn-icon ${isActive('/settings') ? 'btn-icon-active' : ''}`}
              style={{ marginRight: 8 }}
              aria-label="Impostazioni"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Link>
            <button onClick={onLogout} className="btn-logout">
              Esci
            </button>
          </div>

        </div>
      </aside>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* AREA PRINCIPALE */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0 transition-all duration-300">
        
        <header className="main-header flex items-center justify-between">
          
          <div className="flex items-center gap-3 w-1/4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
              title={isSidebarOpen ? "Nascondi menu" : "Mostra menu"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M20 19l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="progress-container flex-1 max-w-md mx-4">
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
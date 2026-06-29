// src/components/AppShellLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDay } from '../context/DayContext';

interface AppShellLayoutProps {
  onLogout?: () => void;
}

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { changeDate } = useDay();
  
  // true = Sidebar estesa (w-64), false = Mini Sidebar con icone (w-20)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAgendaHovered, setIsAgendaHovered] = useState(false);

  const displayUsername = user?.username ? user.username.toUpperCase() : 'OSPITE';
  const isActive = (path: string) => location.pathname === path;
  const isAgendaActive = isActive('/') || isActive('/giorno') || isActive('/settimana') || isActive('/mese');

  // Funzione per generare classi CSS dinamiche e perfette per i bottoni principali
  const getNavLinkClass = (active: boolean) => {
    const base = "flex items-center transition-all duration-200 rounded-xl focus:outline-none cursor-pointer";
    const layout = isSidebarOpen ? "px-4 py-3 gap-4 mx-2 justify-start" : "py-3 mx-3 justify-center";
    const colors = active 
      ? "bg-blue-600 text-white shadow-md" 
      // Qui abbiamo aumentato il contrasto per l'hover (bg-gray-700 o bg-white/10)
      : "text-gray-400 hover:bg-gray-700 hover:text-white"; 
    return `${base} ${layout} ${colors}`;
  };

  return (
    <div className="app-container flex h-screen overflow-hidden relative bg-gray-50">
      
      {/* SIDEBAR DINAMICA (Sfondo scuro nativo) */}
      <aside 
        className={`h-full z-40 bg-gray-900 transition-all duration-300 ease-in-out shrink-0 overflow-hidden flex flex-col shadow-xl
        ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="h-full flex flex-col py-4 justify-between">
          
          {/* HEADER DELLA SIDEBAR */}
          <div className={`flex items-center mb-8 min-h-[40px] ${isSidebarOpen ? 'justify-between px-6' : 'justify-center px-0'}`}>
            {isSidebarOpen && (
              <div className="truncate pr-2">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Benvenuto</h2>
                <h1 className="text-xl font-extrabold text-white mt-0.5 truncate">{displayUsername}</h1>
              </div>
            )}
            
            {/* Tasto Switch Sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all focus:outline-none"
              title={isSidebarOpen ? "Rimpicciolisci menu" : "Espandi menu"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300" style={{ transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* NAVIGAZIONE PRINCIPALE */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            
            {/* ITEM: AGENDA CON SOTTOMENU */}
            <div 
              onMouseEnter={() => setIsAgendaHovered(true)} 
              onMouseLeave={() => setIsAgendaHovered(false)}
              className="flex flex-col"
            >
              <Link to="/" className={getNavLinkClass(isAgendaActive)} title={!isSidebarOpen ? "Agenda" : undefined}>
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {isSidebarOpen && <span className="font-semibold tracking-wide">Agenda</span>}
              </Link>

              {/* SOTTOMENU (Visibile sia aperto che chiuso se attivo o in hover) */}
              {(isAgendaActive || isAgendaHovered) && (
                <div className={`flex flex-col mt-1 mb-2 animate-fadeIn ${isSidebarOpen ? 'pl-8 pr-2 space-y-1' : 'items-center space-y-2 mt-2'}`}>
                  
                  {/* Sottomenu: GIORNO */}
                  <Link to="/giorno" onClick={() => changeDate(new Date())} title={!isSidebarOpen ? "Giorno" : undefined} className={`flex items-center gap-3 rounded-lg transition-colors focus:outline-none ${isSidebarOpen ? 'py-1.5 px-3' : 'p-2 justify-center'} ${isActive('/giorno') ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    <span className={`rounded-full shrink-0 ${isActive('/giorno') ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-blue-600'} ${isSidebarOpen ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'}`}></span>
                    {isSidebarOpen && <span className="text-sm">Giorno</span>}
                  </Link>

                  {/* Sottomenu: SETTIMANA */}
                  <Link to="/settimana" title={!isSidebarOpen ? "Settimana" : undefined} className={`flex items-center gap-3 rounded-lg transition-colors focus:outline-none ${isSidebarOpen ? 'py-1.5 px-3' : 'p-2 justify-center'} ${isActive('/settimana') ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    <span className={`rounded-full shrink-0 ${isActive('/settimana') ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-green-600'} ${isSidebarOpen ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'}`}></span>
                    {isSidebarOpen && <span className="text-sm">Settimana</span>}
                  </Link>

                  {/* Sottomenu: MESE */}
                  <Link to="/mese" title={!isSidebarOpen ? "Mese" : undefined} className={`flex items-center gap-3 rounded-lg transition-colors focus:outline-none ${isSidebarOpen ? 'py-1.5 px-3' : 'p-2 justify-center'} ${isActive('/mese') ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    <span className={`rounded-full shrink-0 ${isActive('/mese') ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'bg-purple-600'} ${isSidebarOpen ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'}`}></span>
                    {isSidebarOpen && <span className="text-sm">Mese</span>}
                  </Link>

                </div>
              )}
            </div>

            {/* ITEM: FREE TIME */}
            <Link to="/free-time" className={getNavLinkClass(isActive('/free-time'))} title={!isSidebarOpen ? "Free Time" : undefined}>
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0l-1.414-1.414a4 4 0 010-5.656l1.414-1.414a4 4 0 015.656 0l1.414 1.414a4 4 0 010 5.656l-1.414 1.414z" /></svg>
              {isSidebarOpen && <span className="font-semibold tracking-wide">Free Time</span>}
            </Link>

            {/* ITEM: UNIVERSITÀ */}
            <Link to="/universita" className={getNavLinkClass(isActive('/universita'))} title={!isSidebarOpen ? "Università" : undefined}>
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
              {isSidebarOpen && <span className="font-semibold tracking-wide">Università</span>}
            </Link>

            {/* ITEM: SHOPPING */}
            <Link to="/shopping" className={getNavLinkClass(isActive('/shopping'))} title={!isSidebarOpen ? "Shopping" : undefined}>
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {isSidebarOpen && <span className="font-semibold tracking-wide">Shopping</span>}
            </Link>

            {/* DIVISORE MENU SVILUPPO */}
            <div className="pt-4 mt-2 border-t border-gray-800 flex flex-col gap-1">
              {isSidebarOpen && <p className="px-6 text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sviluppo</p>}
              
              <Link to="/tasks" className={getNavLinkClass(isActive('/tasks'))} title={!isSidebarOpen ? "Lista Tasks" : undefined}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                {isSidebarOpen && <span className="text-sm font-medium">Lista Tasks</span>}
              </Link>

              <Link to="/events" className={getNavLinkClass(isActive('/events'))} title={!isSidebarOpen ? "Lista Eventi" : undefined}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {isSidebarOpen && <span className="text-sm font-medium">Lista Eventi</span>}
              </Link>

              <Link to="/categories" className={getNavLinkClass(isActive('/categories'))} title={!isSidebarOpen ? "Categorie" : undefined}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {isSidebarOpen && <span className="text-sm font-medium">Categorie</span>}
              </Link>
            </div>
          </nav>

          {/* FOOTER SIDEBAR: Settings + Logout */}
          <div className={`pt-4 mt-2 border-t border-gray-800 flex ${isSidebarOpen ? 'flex-row items-center justify-between px-6' : 'flex-col gap-6 items-center px-0'} shrink-0`}>
            <Link
              to="/settings"
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none"
              title="Impostazioni"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Link>
            <button 
              onClick={onLogout} 
              className={`font-bold rounded-xl text-red-400 transition-colors focus:outline-none ${isSidebarOpen ? 'text-sm w-full py-1  hover:text-white hover:bg-red-600 ' : 'text-[14px] pb-2 hover:text-red-200'}`}
              title="Disconnetti"
            >
              {isSidebarOpen ? 'Esci' : 'Esci'}
            </button>
          </div>

        </div>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AppShellLayout;
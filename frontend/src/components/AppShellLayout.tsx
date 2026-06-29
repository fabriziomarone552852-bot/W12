// src/components/AppShellLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SettingsIcon, SwitchSidebarIcon, CategoryIcon, TaskListIcon, ShoppingIcon, UniversityIcon, FreeTimeIcon, CalendarIcon, CountdownIcon } from './shared/utils/Icons';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isSidebarOpen: boolean;
  isDevMenu?: boolean; // Opzionale, per capire se usare testi più piccoli
}

interface AppShellLayoutProps {
  onLogout?: () => void;
}

const AppShellLayout: React.FC<AppShellLayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();
  
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

  const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, isActive, isSidebarOpen, isDevMenu }) => {
  const base = "flex items-center transition-all duration-200 rounded-xl focus:outline-none cursor-pointer";
  const layout = isSidebarOpen ? "px-4 py-3 gap-4 mx-2 justify-start" : "py-3 mx-3 justify-center";
  const colors = isActive 
    ? "bg-blue-600 text-white shadow-md" 
    : "text-gray-400 hover:bg-gray-700 hover:text-white";

  return (
    <Link to={to} className={`${base} ${layout} ${colors}`} title={!isSidebarOpen ? label : undefined}>
      <span className="w-6 h-6 shrink-0">{icon}</span>
      {isSidebarOpen && <span className="font-semibold tracking-wide text-sm">{label}</span>}
    </Link>
  );
};

  const mainNavItems = [
  { to: '/free-time', label: 'Free Time', icon: <FreeTimeIcon className="w-6 h-6 shrink-0" /> },
  { to: '/universita', label: 'Università', icon: <UniversityIcon className="w-6 h-6 shrink-0" /> },
  { to: '/shopping', label: 'Shopping', icon: <ShoppingIcon className="w-6 h-6 shrink-0" /> }
];

const devNavItems = [
  { to: '/tasks', label: 'Lista Tasks', icon: <TaskListIcon className="w-5 h-5 shrink-0" /> },
  { to: '/events', label: 'Lista Eventi', icon: <CalendarIcon className="w-5 h-5 shrink-0" /> },
  { to: '/categories', label: 'Categorie', icon: <CategoryIcon className="w-5 h-5 shrink-0" /> }
];

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
              <SwitchSidebarIcon className={`h-5 w-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
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
                <CountdownIcon className="w-6 h-6 shrink-0" />
                {isSidebarOpen && <span className="font-semibold tracking-wide">Agenda</span>}
              </Link>

              {/* SOTTOMENU (Visibile sia aperto che chiuso se attivo o in hover) */}
              {(isAgendaActive || isAgendaHovered) && (
                <div className={`flex flex-col mt-1 mb-2 animate-fadeIn ${isSidebarOpen ? 'pl-8 pr-2 space-y-1' : 'items-center space-y-2 mt-2'}`}>
                  
                  {/* Sottomenu: GIORNO */}
                  <Link 
                        to="/giorno" 
                        title={!isSidebarOpen ? "Giorno" : undefined} 
                        className={`flex items-center gap-3 rounded-lg transition-colors focus:outline-none ${isSidebarOpen ? 'py-1.5 px-3' : 'p-2 justify-center'} ${isActive('/giorno') ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                      >
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

            {/* ========================================= */}
            {/* VOCI PRINCIPALI MAPPATE IN AUTOMATICO */}
            {/* ========================================= */}
            {mainNavItems.map(item => (
              <SidebarItem 
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                isActive={isActive(item.to)}
                isSidebarOpen={isSidebarOpen}
              />
            ))}

            {/* ========================================= */}
            {/* DIVISORE MENU SVILUPPO E VOCI MAPPATE */}
            {/* ========================================= */}
            <div className="pt-4 mt-2 border-t border-gray-800 flex flex-col gap-1">
              {isSidebarOpen && <p className="px-6 text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sviluppo</p>}
              
              {devNavItems.map(item => (
                <SidebarItem 
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive(item.to)}
                  isSidebarOpen={isSidebarOpen}
                  isDevMenu={true}
                />
              ))}
            </div>

          </nav>

          {/* FOOTER SIDEBAR: Settings + Logout */}
          <div className={`pt-4 mt-2 border-t border-gray-800 flex ${isSidebarOpen ? 'flex-row items-center justify-between px-6' : 'flex-col gap-6 items-center px-0'} shrink-0`}>
            <Link
              to="/settings"
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none"
              title="Impostazioni"
            >
              <SettingsIcon className="w-6 h-6" />
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
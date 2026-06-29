// src/views/HomePage.tsx
import React, { useState } from 'react';

// --- MOCK DATA ESPANSI (6 task per testare le pagine) ---
const initialTodos = [
  { id: 1, title: 'Pagare bolletta', deadline: 'Oggi', done: false, priority: 'Alta', category: 'Casa', description: 'Ricordarsi di pagare la bolletta della luce dal sito delle poste.', location: 'Online' },
  { id: 2, title: 'Studiare React', deadline: 'Domani', done: false, priority: 'Media', category: 'Università', description: 'Finire il capitolo sugli Hooks e fare pratica con useState.', location: 'Scrivania' },
  { id: 3, title: 'Chiamare meccanico della domenica dopo essere fatto delalda', deadline: '15/06', done: true, priority: 'Bassa', category: 'Auto', description: 'Chiedere preventivo per il tagliando annuale.', location: 'Telefono' },
  { id: 4, title: 'Comprare la spesa settimanale', deadline: '16/06', done: false, priority: 'Media', category: 'Casa', description: 'Prendere latte, uova, petto di pollo e verdure.', location: 'Supermercato' },
  { id: 5, title: 'Allenamento gambe in palestra', deadline: '17/06', done: false, priority: 'Bassa', category: 'Salute', description: 'Squat, affondi e leg press. Non saltare!', location: 'Palestra' },
  { id: 6, title: 'Revisione progetto con papà', deadline: '20/06', done: false, priority: 'Alta', category: 'Sviluppo', description: 'Controllare i collegamenti delle API del backend.', location: 'Studio' },
];

const mockTodayEvents = [
  { id: 1, time: '11:30', title: 'Lezione Università', color: 'bg-blue-500' },
  { id: 2, time: '12:00', title: 'Pranzo con Marco', color: 'bg-orange-500' },
  { id: 3, time: '15:00', title: 'Palestra', color: 'bg-purple-500' },
];

const mockNext30Days = [
  { id: 1, title: 'Progetto Finale', date: '25 Giu', priority: 'Alta', category: 'Università' },
  { id: 2, title: 'Visita medica', date: '02 Lug', priority: 'Media', category: 'Personale' },
];

const HomePage: React.FC = () => {
  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [todos, setTodos] = useState(initialTodos);
  const [selectedTask, setSelectedTask] = useState<typeof initialTodos[0] | null>(null);

  // --- LOGICA DI PAGINAZIONE ---
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 3; // Quante task vuoi vedere per pagina

  const totalPages = Math.ceil(todos.length / TASKS_PER_PAGE);
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  // Taglia l'array per mostrare solo le 3 task della pagina corrente
  const visibleTodos = todos.slice(startIndex, startIndex + TASKS_PER_PAGE);

  const toggleTodo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos(todos.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full relative">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        
        {/* COLONNA SINISTRA: TO-DO */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[410px] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">To-Do</h3>
              
              {/* Lista delle Task della pagina corrente */}
              <div className="space-y-3 min-h-[228px]">
                {visibleTodos.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)} 
                    className="flex items-center justify-between group cursor-pointer bg-gray-50 border border-gray-200 h-16 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <input 
                        type="checkbox" 
                        checked={task.done}
                        onChange={() => {}} 
                        onClick={(e) => toggleTodo(task.id, e)}
                        className={`w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${
                          task.done ? 'text-gray-500 accent-gray-500 focus:ring-gray-500' : 'text-blue-600 accent-blue-600 focus:ring-blue-500'
                        }`}
                      />
                      <span 
                        title={task.title}
                        className={`text-sm font-medium transition-all line-clamp-2 ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}
                      >
                        {task.title}
                      </span>
                    </div>
                    
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 ml-2 transition-colors ${task.done ? 'text-gray-500' : 'bg-red-100 text-red-700'}`}>
                      {task.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CONTROLLI DI PAGINAZIONE (Mostrati solo se c'è più di una pagina) */}
            <div className="flex flex-col gap-2 mt-2">
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-1">
                  {/* Freccia Sinistra */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Indicatore di pagina */}
                  <span className="text-xs font-bold text-gray-500 tracking-wider">
                    {currentPage} / {totalPages}
                  </span>

                  {/* Freccia Destra */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex justify-center items-center font-bold text-sm gap-2">
                <svg xmlns="http://www.w3.org/2000/xl" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nuova Task
              </button>
            </div>

          </div>
        </div>

        {/* COLONNA CENTRALE: CALENDARIO */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-4 border-b pb-2">
              <div className="flex gap-4">
                <h3 className="text-xl font-extrabold text-gray-800">Giugno</h3>
                <h3 className="text-xl font-medium text-gray-400">Luglio</h3>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setView('Mese')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Mese' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                >
                  MESE
                </button>
                <button 
                  onClick={() => setView('Settimana')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Settimana' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                >
                  SETTIMANA
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
                  <div key={i} className="text-xs font-bold text-gray-400 uppercase">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 flex-1">
                <div className="p-2 border border-transparent"></div>
                <div className="p-2 border border-transparent"></div>
                
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayNum = i + 1;
                  const hasBlueEvent = dayNum === 8 || dayNum === 15;
                  const hasOrangeEvent = dayNum === 8 || dayNum === 22;

                  return (
                    <div key={dayNum} className="relative p-2 border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer min-h-[60px]">
                      <span className="text-sm font-medium text-gray-700">{dayNum}</span>
                      
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {hasBlueEvent && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                        {hasOrangeEvent && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: TODAY */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">Today</h3>
            
            <div className="flex-1 space-y-4">
              {mockTodayEvents.map(ev => (
                <div key={ev.id} className="flex gap-3 items-start group cursor-pointer">
                  <div className="w-12 text-right">
                    <span className="text-xs font-bold text-gray-500">{ev.time}</span>
                  </div>
                  <div className={`w-1 rounded-full self-stretch ${ev.color}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{ev.title}</p>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 text-center text-xs text-gray-400 italic">
                Nessun altro evento per oggi
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SEZIONE INFERIORE: NEXT 30 DAYS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">
          To-Do in the next 30 days
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b">
                <th className="pb-2 pl-2 w-10">Fatto</th>
                <th className="pb-2">Task</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Scadenza</th>
                <th className="pb-2">Priorità</th>
              </tr>
            </thead>
            <tbody>
              {mockNext30Days.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                  <td className="py-3 pl-2">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md">
                      {task.category}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-bold text-gray-600">{task.date}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALE DETTAGLIO TASK --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md uppercase">
                  {selectedTask.category}
                </span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${
                  selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className={`text-2xl font-extrabold text-gray-800 ${selectedTask.done ? 'line-through text-gray-400' : ''}`}>
                  {selectedTask.title}
                </h2>
                <p className="text-sm font-bold text-red-500 mt-1">Scadenza: {selectedTask.deadline}</p>
              </div>

              {selectedTask.location && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {selectedTask.location}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Descrizione</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => {
                  toggleTodo(selectedTask.id, { stopPropagation: () => {} } as any);
                  setSelectedTask(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  selectedTask.done 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {selectedTask.done ? 'Segna da fare' : 'Completata!'}
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
                Modifica
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;
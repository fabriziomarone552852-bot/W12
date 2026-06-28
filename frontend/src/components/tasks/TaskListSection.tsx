import React from 'react';
import type { Task } from '../../types/tasks';

interface TaskListSectionProps {
  loading: boolean;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  safeCurrentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsContent: React.ReactNode;
  rowsPerPageOptions: number[];
}

const TaskListSection: React.FC<TaskListSectionProps> = ({
  loading,
  totalItems,
  startIndex,
  endIndex,
  rowsPerPage,
  setRowsPerPage,
  safeCurrentPage,
  totalPages,
  setCurrentPage,
  rowsContent,
  rowsPerPageOptions,
}) => {
  return (
    <section>
      <h2>Elenco tasks</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          {totalItems === 0
            ? 'Nessun task trovato'
            : `Mostrando ${startIndex + 1}-${endIndex} di ${totalItems} task`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="rowsPerPageTasks">Righe per pagina</label>
          <select
            id="rowsPerPageTasks"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Caricamento...</p>
      ) : totalItems === 0 ? (
        <p>Nessun risultato trovato con i filtri correnti.</p>
      ) : (
        <>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Titolo</th>
                <th style={{ textAlign: 'left' }}>Descrizione</th>
                <th>Data inizio</th>
                <th>Scadenza</th>
                <th>Priorità</th>
                <th>Categoria</th>
                <th>Luogo</th>
                <th>Fatto</th>
                <th>Azioni</th>
              </tr>
            </thead>
			<tbody>{rowsContent}</tbody>
          </table>

          <nav
            aria-label="Paginazione tasks"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              Pagina {safeCurrentPage} di {totalPages}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1 || loading}
              >
                Precedente
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages || loading}
              >
                Successiva
              </button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
};

export default TaskListSection;
import React from 'react';
import type { Category } from '../../types/tasks';

interface TaskFiltersProps {
  filtroStato: 'tutti' | 'aperti' | 'completati';
  setFiltroStato: (value: 'tutti' | 'aperti' | 'completati') => void;
  filtroCategoryId: string;
  setFiltroCategoryId: (value: string) => void;
  filtroPriorita: string;
  setFiltroPriorita: (value: string) => void;
  filtroTitolo: string;
  setFiltroTitolo: (value: string) => void;
  filtroLuogo: string;
  setFiltroLuogo: (value: string) => void;
  filtroDataStart: string;
  setFiltroDataStart: (value: string) => void;
  filtroDataScadenza: string;
  setFiltroDataScadenza: (value: string) => void;
  resetFiltri: () => void;
  loading: boolean;
  categories: Category[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filtroStato,
  setFiltroStato,
  filtroCategoryId,
  setFiltroCategoryId,
  filtroPriorita,
  setFiltroPriorita,
  filtroTitolo,
  setFiltroTitolo,
  filtroLuogo,
  setFiltroLuogo,
  filtroDataStart,
  setFiltroDataStart,
  filtroDataScadenza,
  setFiltroDataScadenza,
  resetFiltri,
  loading,
  categories,
}) => {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Filtri</h2>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Stato
          </label>
          <select
            value={filtroStato}
            onChange={(e) =>
              setFiltroStato(
                e.target.value as 'tutti' | 'aperti' | 'completati'
              )
            }
          >
            <option value="tutti">Tutti</option>
            <option value="aperti">Solo aperti</option>
            <option value="completati">Solo completati</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Categoria
          </label>
          <select
            value={filtroCategoryId}
            onChange={(e) => setFiltroCategoryId(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Priorità
          </label>
          <select
            value={filtroPriorita}
            onChange={(e) => setFiltroPriorita(e.target.value)}
          >
            <option value="">Tutte le priorità</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Bassa">Bassa</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Titolo contiene
          </label>
          <input
            value={filtroTitolo}
            onChange={(e) => setFiltroTitolo(e.target.value)}
            placeholder="Testo nel titolo"
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Luogo contiene
          </label>
          <input
            value={filtroLuogo}
            onChange={(e) => setFiltroLuogo(e.target.value)}
            placeholder="Testo nel luogo"
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Data inizio da
          </label>
          <input
            type="date"
            value={filtroDataStart}
            onChange={(e) => setFiltroDataStart(e.target.value)}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Scadenza entro
          </label>
          <input
            type="date"
            value={filtroDataScadenza}
            onChange={(e) => setFiltroDataScadenza(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="button" onClick={resetFiltri} disabled={loading}>
            Reset filtri
          </button>
        </div>
      </div>
    </section>
  );
};

export default TaskFilters;
import React from 'react';
import type { Category, Priorita, TaskCreateFormState } from '../../types/tasks';

interface TaskCreateFormProps {
  form: TaskCreateFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskCreateFormState>>;
  creaTask: (e: React.FormEvent) => Promise<void> | void;
  loading: boolean;
  categories: Category[];
  handleNuovaCategoria: () => void;
}

const TaskCreateForm: React.FC<TaskCreateFormProps> = ({
  form,
  setForm,
  creaTask,
  loading,
  categories,
  handleNuovaCategoria,
}) => {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Nuovo task</h2>
      <form
        onSubmit={creaTask}
        style={{ display: 'grid', gap: 12, maxWidth: 900 }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Titolo
          </label>
          <input
            value={form.titolo}
            onChange={(e) =>
              setForm((p) => ({ ...p, titolo: e.target.value }))
            }
            placeholder="Es. Spesa settimanale"
            required
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
            Descrizione
          </label>
          <textarea
            value={form.descrizione}
            onChange={(e) =>
              setForm((p) => ({ ...p, descrizione: e.target.value }))
            }
            placeholder="Dettagli opzionali"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
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
              Data inizio
            </label>
            <input
              type="date"
              value={form.data_start}
              onChange={(e) =>
                setForm((p) => ({ ...p, data_start: e.target.value }))
              }
              required
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
              Data scadenza
            </label>
            <input
              type="date"
              value={form.data_scadenza}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  data_scadenza: e.target.value,
                }))
              }
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
              Priorità
            </label>
            <select
              value={form.priorita}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  priorita: e.target.value as Priorita,
                }))
              }
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Bassa">Bassa</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
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
              Categoria
            </label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  category_id: e.target.value,
                }))
              }
            >
              <option value="">Nessuna categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={handleNuovaCategoria}
                style={{ fontSize: 12 }}
              >
                + Nuova categoria
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Luogo
            </label>
            <input
              value={form.luogo}
              onChange={(e) =>
                setForm((p) => ({ ...p, luogo: e.target.value }))
              }
              placeholder="Es. Casa, Ufficio..."
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          Crea task
        </button>
      </form>
    </section>
  );
};

export default TaskCreateForm;
import React from 'react';
import type {
  Category,
  Task,
  SubtaskFormState,
  EditTaskFormState,
} from '../../types/tasks';

interface TaskRowsProps {
  tasks: Task[];
  subtasksByParent: Map<number, Task[]>;
  loading: boolean;
  categories: Category[];
  parentForSubtaskId: number | null;
  setParentForSubtaskId: React.Dispatch<React.SetStateAction<number | null>>;
  subtaskForm: SubtaskFormState;
  setSubtaskForm: React.Dispatch<React.SetStateAction<SubtaskFormState>>;
  creaSubtaskInline: (parentId: number) => Promise<void> | void;
  editingTaskId: number | null;
  setEditingTaskId: React.Dispatch<React.SetStateAction<number | null>>;
  editForm: EditTaskFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditTaskFormState>>;
  saveEditTask: (taskId: number) => Promise<void> | void;
  startEditTask: (task: Task) => void;
  deleteTask: (task: Task) => Promise<void> | void;
  toggleFatto: (task: Task) => Promise<void> | void;
  setFamilyTaskId: (id: number | null) => void;
  formatDateTime: (value: string | null | undefined) => string;
}

const TaskRows: React.FC<TaskRowsProps> = ({
  tasks,
  subtasksByParent,
  loading,
  categories,
  parentForSubtaskId,
  setParentForSubtaskId,
  subtaskForm,
  setSubtaskForm,
  creaSubtaskInline,
  editingTaskId,
  setEditingTaskId,
  editForm,
  setEditForm,
  saveEditTask,
  startEditTask,
  deleteTask,
  toggleFatto,
  setFamilyTaskId,
  formatDateTime,
}) => {
  const renderTaskRow = (task: Task, level: number): React.ReactNode => {
    const children = subtasksByParent.get(task.id) ?? [];

    return (
      <React.Fragment key={task.id}>
        <tr>
          <td style={{ paddingLeft: 16 + level * 24 }}>
            {level > 0 ? '↳ ' : ''}
            {task.titolo}
          </td>
          <td>{task.descrizione || '-'}</td>
          <td>{task.data_start}</td>
          <td>{task.data_scadenza || '-'}</td>
          <td>{task.priorita}</td>
          <td>{task.category_name || '-'}</td>
          <td>{task.luogo || '-'}</td>
          <td>
            <input
              type="checkbox"
              checked={task.fatto}
              onChange={() => toggleFatto(task)}
              disabled={loading}
            />
            {task.fatto && task.data_fatto && (
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                {formatDateTime(task.data_fatto)}
              </div>
            )}
          </td>
          <td style={{ whiteSpace: 'nowrap' }}>
            <button
              onClick={() => {
                setEditingTaskId(null);
                setParentForSubtaskId(task.id);
              }}
              disabled={loading}
            >
              + Sottotask
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => setFamilyTaskId(task.id)}
              disabled={loading}
            >
              Famiglia
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => startEditTask(task)}
              disabled={loading}
            >
              Modifica
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => deleteTask(task)}
              disabled={loading}
            >
              Elimina
            </button>
          </td>
        </tr>

        {parentForSubtaskId === task.id && (
          <tr>
            <td colSpan={9} style={{ background: '#f7f7f7' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: 8,
                  border: '1px solid #ddd',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 2, minWidth: 220 }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Titolo sottotask
                  </label>
                  <input
                    value={subtaskForm.titolo}
                    onChange={(e) =>
                      setSubtaskForm((p) => ({
                        ...p,
                        titolo: e.target.value,
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
                    Data inizio
                  </label>
                  <input
                    type="date"
                    value={subtaskForm.data_start}
                    onChange={(e) =>
                      setSubtaskForm((p) => ({
                        ...p,
                        data_start: e.target.value,
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
                    Data scadenza
                  </label>
                  <input
                    type="date"
                    value={subtaskForm.data_scadenza}
                    onChange={(e) =>
                      setSubtaskForm((p) => ({
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
                    value={subtaskForm.priorita}
                    onChange={(e) =>
                      setSubtaskForm((p) => ({
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

                <button
                  onClick={() => creaSubtaskInline(task.id)}
                  disabled={loading}
                >
                  Salva
                </button>
                <button
                  onClick={() => setParentForSubtaskId(null)}
                  disabled={loading}
                >
                  Annulla
                </button>
              </div>
            </td>
          </tr>
        )}

        {editingTaskId === task.id && (
          <tr>
            <td colSpan={9} style={{ background: '#eef6ff' }}>
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  padding: 12,
                  border: '1px solid #cfe0ff',
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
                    Titolo
                  </label>
                  <input
                    value={editForm.titolo}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        titolo: e.target.value,
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
                    Descrizione
                  </label>
                  <textarea
                    value={editForm.descrizione}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        descrizione: e.target.value,
                      }))
                    }
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
                      value={editForm.data_start}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          data_start: e.target.value,
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
                      Data scadenza
                    </label>
                    <input
                      type="date"
                      value={editForm.data_scadenza}
                      onChange={(e) =>
                        setEditForm((p) => ({
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
                      value={editForm.priorita}
                      onChange={(e) =>
                        setEditForm((p) => ({
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
                      value={editForm.category_id}
                      onChange={(e) =>
                        setEditForm((p) => ({
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
                      value={editForm.luogo}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          luogo: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editForm.fatto}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        fatto: e.target.checked,
                      }))
                    }
                  />
                  <span>Task completato</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => saveEditTask(task.id)}
                    disabled={loading}
                  >
                    Salva modifiche
                  </button>
                  <button
                    onClick={() => setEditingTaskId(null)}
                    disabled={loading}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}

        {children.map((child) => renderTaskRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return <>{tasks.map((task) => renderTaskRow(task, 0))}</>;
};

export default TaskRows;
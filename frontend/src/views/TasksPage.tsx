import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import TaskFamilyPanel from '@/components/tasks/TaskFamilyPanel';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import TaskListSection from '@/components/tasks/TaskListSection';
import TaskRows from '@/components/tasks/TaskRows';
import type {
  Task,
  Priorita,
  Category,
  TaskCreateFormState,
  SubtaskFormState,
  EditTaskFormState,
} from '@/types/tasks';

interface LocationState {
  createdCategory?: Category;
}

const todayString = () => new Date().toISOString().slice(0, 10);
const normalizeDate = (value: string | null | undefined) => (value ? value.slice(0, 10) : '');

const makeEmptyTaskForm = (defaultCategoryId: string = ''): TaskCreateFormState => ({
  titolo: '',
  descrizione: '',
  data_start: todayString(),
  data_scadenza: '',
  priorita: 'Media' as Priorita,
  category_id: defaultCategoryId,
  luogo: '',
});

const makeEmptySubtaskForm = (): SubtaskFormState => ({
  titolo: '',
  data_start: todayString(),
  data_scadenza: '',
  priorita: 'Media' as Priorita,
});

const makeEmptyEditForm = (): EditTaskFormState => ({
  titolo: '',
  descrizione: '',
  data_start: '',
  data_scadenza: '',
  priorita: 'Media' as Priorita,
  category_id: '',
  luogo: '',
  fatto: false,
});

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const statCardClass = 'rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur';
const panelClass = 'rounded-[30px] border border-white/70 bg-white/95 shadow-[0_12px_34px_rgba(15,23,42,0.08)] backdrop-blur';

const TasksPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<TaskCreateFormState>(makeEmptyTaskForm());
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroCategoryId, setFiltroCategoryId] = useState('');
  const [filtroPriorita, setFiltroPriorita] = useState('');
  const [filtroTitolo, setFiltroTitolo] = useState('');
  const [filtroLuogo, setFiltroLuogo] = useState('');
  const [filtroDataStart, setFiltroDataStart] = useState('');
  const [filtroDataScadenza, setFiltroDataScadenza] = useState('');

  const debouncedFiltroTitolo = useDebounce(filtroTitolo);
  const debouncedFiltroLuogo = useDebounce(filtroLuogo);

  const [parentForSubtaskId, setParentForSubtaskId] = useState<number | null>(null);
  const [subtaskForm, setSubtaskForm] = useState<SubtaskFormState>(makeEmptySubtaskForm());

  const [familyTaskId, setFamilyTaskId] = useState<number | null>(null);
  const [familyRoot, setFamilyRoot] = useState<Task | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditTaskFormState>(makeEmptyEditForm());

  const authHeaderObj = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2600);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (state.createdCategory) {
      const catId = String(state.createdCategory.id);
      setForm((p) => ({ ...p, category_id: catId }));
      setFiltroCategoryId(catId);
    }
  }, [state.createdCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(apiUrl('/categories?genre=1'), { headers: authHeaderObj });
      if (!res.ok) {
        setCategories([]);
        return;
      }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroStato === 'completati') params.set('fatto', 'true');
      if (filtroStato === 'aperti') params.set('fatto', 'false');
      if (filtroCategoryId) params.set('category_id', filtroCategoryId);
      if (filtroPriorita) params.set('priorita', filtroPriorita);
      if (debouncedFiltroTitolo.trim()) params.set('titolo', debouncedFiltroTitolo.trim());
      if (debouncedFiltroLuogo.trim()) params.set('luogo', debouncedFiltroLuogo.trim());
      if (filtroDataStart) params.set('data_start', filtroDataStart);
      if (filtroDataScadenza) params.set('data_scadenza', filtroDataScadenza);

      const queryString = params.toString();
      const res = await fetch(apiUrl(queryString ? `/tasks?${queryString}` : '/tasks'), { headers: authHeaderObj });
      if (res.status === 304 || !res.ok) {
        setTasks([]);
        if (res.status !== 304) setError('Errore durante il caricamento dei task.');
        return;
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      console.error(err);
      setTasks([]);
      setError('Errore durante il caricamento dei task.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamily = async (taskId: number) => {
    setLoadingFamily(true);
    try {
      const res = await fetch(apiUrl(`/tasks/${taskId}/family`), { headers: authHeaderObj });
      if (res.status === 304 || !res.ok) {
        setFamilyRoot(null);
        return;
      }
      const data = await res.json();
      setFamilyRoot(data);
    } catch (err) {
      console.error(err);
      setFamilyRoot(null);
    } finally {
      setLoadingFamily(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [authHeaderObj]);

  useEffect(() => {
    fetchTasks();
  }, [
    filtroStato,
    filtroCategoryId,
    filtroPriorita,
    debouncedFiltroTitolo,
    debouncedFiltroLuogo,
    filtroDataStart,
    filtroDataScadenza,
    authHeaderObj,
  ]);

  useEffect(() => {
    if (familyTaskId != null) fetchFamily(familyTaskId);
  }, [familyTaskId, authHeaderObj]);

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);
  const completedRootTasks = useMemo(() => rootTasks.filter((t) => t.fatto).length, [rootTasks]);
  const overdueRootTasks = useMemo(() => {
    const today = todayString();
    return rootTasks.filter((t) => !t.fatto && t.data_scadenza && normalizeDate(t.data_scadenza) < today).length;
  }, [rootTasks]);
  const activeSubtasks = useMemo(() => tasks.filter((t) => !!t.parent_id && !t.fatto).length, [tasks]);

  // ⚠️ TEMPORANEO: Vecchia paginazione rimossa. Mostriamo tutto finché non refattorizziamo.
  const safeCurrentPage = 1;
  const setCurrentPage = () => {};
  const rowsPerPage = 50;
  const setRowsPerPage = () => {};
  const totalItems = tasks.length;
  const totalPages = 1;
  const startIndex = 0;
  const endIndex = tasks.length;
  const paginatedTasks = tasks; // Mostriamo tutti i dati temporaneamente

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filtroStato,
    filtroCategoryId,
    filtroPriorita,
    debouncedFiltroTitolo,
    debouncedFiltroLuogo,
    filtroDataStart,
    filtroDataScadenza,
    setCurrentPage,
  ]);

  const resetFiltri = () => {
    setFiltroStato('tutti');
    setFiltroCategoryId('');
    setFiltroPriorita('');
    setFiltroTitolo('');
    setFiltroLuogo('');
    setFiltroDataStart('');
    setFiltroDataScadenza('');
    setCurrentPage(1);
  };

  const refreshAll = async () => {
    await fetchTasks();
    if (familyTaskId != null) await fetchFamily(familyTaskId);
  };

  const creaTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      titolo: form.titolo,
      descrizione: form.descrizione || null,
      data_start: form.data_start,
      data_scadenza: form.data_scadenza || null,
      priorita: form.priorita,
      category_id: form.category_id ? Number(form.category_id) : null,
      luogo: form.luogo || null,
      parent_id: null,
    };
    try {
      const res = await fetch(apiUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaderObj },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSuccess(null);
        setError('Impossibile creare il task.');
        return;
      }
      setForm(makeEmptyTaskForm(form.category_id));
      setCurrentPage(1);
      setSuccess('Task creato con successo.');
      await refreshAll();
    } catch (err) {
      console.error(err);
      setSuccess(null);
      setError('Impossibile creare il task.');
    }
  };

  const toggleFatto = async (task: Task) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/tasks/${task.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaderObj },
        body: JSON.stringify({ fatto: !task.fatto }),
      });
      if (!res.ok) {
        setSuccess(null);
        setError('Impossibile aggiornare lo stato del task.');
        return;
      }
      setSuccess(task.fatto ? 'Task riaperto.' : 'Task completato.');
      await refreshAll();
    } catch (err) {
      console.error(err);
      setSuccess(null);
      setError('Impossibile aggiornare lo stato del task.');
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Vuoi davvero eliminare il task \"${task.titolo}\"?`)) return;
    setError(null);
    try {
      const res = await fetch(apiUrl(`/tasks/${task.id}`), { method: 'DELETE', headers: authHeaderObj });
      if (!res.ok) {
        setSuccess(null);
        setError('Impossibile eliminare il task.');
        return;
      }
      if (editingTaskId === task.id) setEditingTaskId(null);
      if (parentForSubtaskId === task.id) setParentForSubtaskId(null);
      if (familyTaskId === task.id) {
        setFamilyTaskId(null);
        setFamilyRoot(null);
      }
      setSuccess('Task eliminato.');
      await refreshAll();
    } catch (err) {
      console.error(err);
      setSuccess(null);
      setError('Impossibile eliminare il task.');
    }
  };

  const creaSubtaskInline = async (parentId: number) => {
    if (!subtaskForm.titolo || !subtaskForm.data_start) return;
    setError(null);
    const payload = {
      titolo: subtaskForm.titolo,
      descrizione: null,
      data_start: subtaskForm.data_start,
      data_scadenza: subtaskForm.data_scadenza || null,
      priorita: subtaskForm.priorita,
      category_id: null,
      luogo: null,
      parent_id: parentId,
    };
    try {
      const res = await fetch(apiUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaderObj },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSuccess(null);
        setError('Impossibile creare la sottotask.');
        return;
      }
      setSubtaskForm(makeEmptySubtaskForm());
      setParentForSubtaskId(null);
      setSuccess('Sottotask creata.');
      await refreshAll();
    } catch (err) {
      console.error(err);
      setSuccess(null);
      setError('Impossibile creare la sottotask.');
    }
  };

  const startEditTask = (task: Task) => {
    setParentForSubtaskId(null);
    setEditingTaskId(task.id);
    setEditForm({
      titolo: task.titolo,
      descrizione: task.descrizione || '',
      data_start: normalizeDate(task.data_start),
      data_scadenza: normalizeDate(task.data_scadenza),
      priorita: task.priorita,
      category_id: task.category_id ? String(task.category_id) : '',
      luogo: task.luogo || '',
      fatto: task.fatto,
    });
  };

  const saveEditTask = async (taskId: number) => {
    setError(null);
    const payload = {
      titolo: editForm.titolo,
      descrizione: editForm.descrizione || null,
      data_start: editForm.data_start,
      data_scadenza: editForm.data_scadenza || null,
      priorita: editForm.priorita,
      category_id: editForm.category_id ? Number(editForm.category_id) : null,
      luogo: editForm.luogo || null,
      fatto: editForm.fatto,
    };
    try {
      const res = await fetch(apiUrl(`/tasks/${taskId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaderObj },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSuccess(null);
        setError('Impossibile salvare le modifiche del task.');
        return;
      }
      setEditingTaskId(null);
      setSuccess('Task aggiornato.');
      await refreshAll();
    } catch (err) {
      console.error(err);
      setSuccess(null);
      setError('Impossibile salvare le modifiche del task.');
    }
  };

  const handleNuovaCategoria = () => {
    navigate('/categories', { state: { from: 'tasks', genreHint: 1 as const } });
  };

  const subtasksByParent = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of tasks) {
      if (t.parent_id) {
        const arr = map.get(t.parent_id) ?? [];
        arr.push(t);
        map.set(t.parent_id, arr);
      }
    }
    return map;
  }, [tasks]);

  return (
    <div className="min-h-full bg-[#f5f7fb] p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">!</div>
              <div>
                <h2 className="text-sm font-semibold text-red-800">Errore operazione task</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed right-4 top-4 z-50 w-full max-w-sm rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-emerald-800">Operazione completata</h2>
                <p className="mt-1 text-sm text-emerald-700">{success}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100"
                aria-label="Chiudi messaggio di successo"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_340px]">
          <div className={`${panelClass} p-6`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace tasks</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Gestione task</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Organizza task principali, sottotask e priorità in una dashboard unica coerente con la Home.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleNuovaCategoria}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Nuova categoria
                </button>
                <button
                  type="button"
                  onClick={resetFiltri}
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Reset filtri
                </button>
              </div>
            </div>
          </div>

          <div className={`${panelClass} p-6`}>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Panoramica</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Indicatori rapidi</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={statCardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Task radice</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{rootTasks.length}</p>
                </div>
                <div className={statCardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completati</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{completedRootTasks}</p>
                </div>
                <div className={statCardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scaduti</p>
                  <p className="mt-2 text-3xl font-bold text-rose-600">{overdueRootTasks}</p>
                </div>
                <div className={statCardClass}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sottotask aperte</p>
                  <p className="mt-2 text-3xl font-bold text-sky-600">{activeSubtasks}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="space-y-6 min-w-0">
            <div className={`${panelClass} p-5 lg:p-6`}>
              <TaskFilters
                categories={categories}
                filtroStato={filtroStato}
                setFiltroStato={setFiltroStato}
                filtroCategoryId={filtroCategoryId}
                setFiltroCategoryId={setFiltroCategoryId}
                filtroPriorita={filtroPriorita}
                setFiltroPriorita={setFiltroPriorita}
                filtroTitolo={filtroTitolo}
                setFiltroTitolo={setFiltroTitolo}
                filtroLuogo={filtroLuogo}
                setFiltroLuogo={setFiltroLuogo}
                filtroDataStart={filtroDataStart}
                setFiltroDataStart={setFiltroDataStart}
                filtroDataScadenza={filtroDataScadenza}
                setFiltroDataScadenza={setFiltroDataScadenza}
                resetFiltri={resetFiltri}
                onNuovaCategoria={handleNuovaCategoria}
              />
            </div>

            <div className={`${panelClass} overflow-hidden`}>
              <div className="border-b border-slate-100 px-5 py-4 lg:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Archivio task</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">Elenco attività principali</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {loading ? 'Caricamento in corso...' : `${totalItems} task trovati, visualizzazione ${startIndex + 1}-${endIndex}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Righe</span>
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-300"
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <TaskListSection loading={loading}>
                <TaskRows
                  tasks={paginatedRootTasks}
                  subtasksByParent={subtasksByParent}
                  categories={categories}
                  editingTaskId={editingTaskId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  startEditTask={startEditTask}
                  saveEditTask={saveEditTask}
                  cancelEditTask={() => setEditingTaskId(null)}
                  toggleFatto={toggleFatto}
                  deleteTask={deleteTask}
                  parentForSubtaskId={parentForSubtaskId}
                  setParentForSubtaskId={setParentForSubtaskId}
                  subtaskForm={subtaskForm}
                  setSubtaskForm={setSubtaskForm}
                  creaSubtaskInline={creaSubtaskInline}
                  setFamilyTaskId={setFamilyTaskId}
                />
              </TaskListSection>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                  <p>
                    Pagina {safeCurrentPage} di {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Indietro
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safeCurrentPage === totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Avanti
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 min-w-0">
            <div className={`${panelClass} p-5 lg:p-6`}>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Creazione rapida</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Nuovo task</h2>
              </div>
              <TaskCreateForm
                form={form}
                setForm={setForm}
                categories={categories}
                onSubmit={creaTask}
                onNuovaCategoria={handleNuovaCategoria}
              />
            </div>

            <div className={`${panelClass} p-5 lg:p-6`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Relazioni</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Famiglia task</h2>
                </div>
                {familyTaskId != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyTaskId(null);
                      setFamilyRoot(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Chiudi
                  </button>
                )}
              </div>

              {familyTaskId == null ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Seleziona una task dalla tabella per visualizzare la sua famiglia gerarchica.
                </div>
              ) : (
                <TaskFamilyPanel loading={loadingFamily} familyRoot={familyRoot} />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TasksPage;

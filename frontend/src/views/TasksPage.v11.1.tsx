// src/views/TasksPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import TaskFamilyPanel from "../components/tasks/TaskFamilyPanel";
import TaskFilters from '../components/tasks/TaskFilters';
import TaskCreateForm from '../components/tasks/TaskCreateForm';
import TaskListSection from '../components/tasks/TaskListSection';
import TaskRows from '../components/tasks/TaskRows';
import type {
  Task,
  Priorita,
  Category,
  TaskCreateFormState,
  SubtaskFormState,
  EditTaskFormState,
} from '../types/tasks';

interface LocationState {
  createdCategory?: Category;
}

const todayString = () => new Date().toISOString().slice(0, 10);

const normalizeDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : '';

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const makeEmptyTaskForm = (
  defaultCategoryId: string = ''
): TaskCreateFormState => ({
  titolo: '',
  descrizione: '',
  data_start: todayString(),
  data_scadenza: '',
  priorita: 'Media' as Priorita,
  category_id: defaultCategoryId,
  luogo: '',
});

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const TasksPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<TaskCreateFormState>(makeEmptyTaskForm());

  const [filtroStato, setFiltroStato] = useState<
    'tutti' | 'aperti' | 'completati'
  >('tutti');
  const [filtroCategoryId, setFiltroCategoryId] = useState('');
  const [filtroPriorita, setFiltroPriorita] = useState('');
  const [filtroTitolo, setFiltroTitolo] = useState('');
  const [filtroLuogo, setFiltroLuogo] = useState('');
  const [filtroDataStart, setFiltroDataStart] = useState('');
  const [filtroDataScadenza, setFiltroDataScadenza] = useState('');

  const debouncedFiltroTitolo = useDebounce(filtroTitolo);
  const debouncedFiltroLuogo = useDebounce(filtroLuogo);

  const [parentForSubtaskId, setParentForSubtaskId] = useState<number | null>(
    null
  );
  const [subtaskForm, setSubtaskForm] = useState<SubtaskFormState>({
	titolo: '',
	data_start: todayString(),
	data_scadenza: '',
	priorita: 'Media',
  });

  const [familyTaskId, setFamilyTaskId] = useState<number | null>(null);
  const [familyRoot, setFamilyRoot] = useState<Task | null>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditTaskFormState>({
    titolo: '',
    descrizione: '',
    data_start: '',
    data_scadenza: '',
    priorita: 'Media',
    category_id: '',
    luogo: '',
    fatto: false,
  });

  const authHeaderObj = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (state.createdCategory) {
      const catId = String(state.createdCategory.id);
      setForm((p) => ({
        ...p,
        category_id: catId,
      }));
      setFiltroCategoryId(catId);
    }
  }, [state.createdCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(apiUrl('/categories?genre=1'), { headers: authHeaderObj });
      if (!res.ok) return;
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
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
      if (res.status === 304 || !res.ok) { setTasks([]); return; }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamily = async (taskId: number) => {
    setLoadingFamily(true);
    try {
      const res = await fetch(apiUrl(`/tasks/${taskId}/family`), { headers: authHeaderObj });
      if (res.status === 304 || !res.ok) { setFamilyRoot(null); return; }
      const data = await res.json();
      setFamilyRoot(data);
    } catch (err) {
      setFamilyRoot(null);
    } finally {
      setLoadingFamily(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [authHeaderObj]);

  useEffect(() => {
    fetchTasks();
  }, [
    filtroStato, filtroCategoryId, filtroPriorita,
    debouncedFiltroTitolo, debouncedFiltroLuogo,
    filtroDataStart, filtroDataScadenza, authHeaderObj,
  ]);

  useEffect(() => {
    if (familyTaskId != null) fetchFamily(familyTaskId);
  }, [familyTaskId, authHeaderObj]);

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);

  const {
    currentPage: safeCurrentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage,
    totalItems, totalPages, startIndex, endIndex,
    paginatedData: paginatedRootTasks,
  } = usePagination({ data: rootTasks });

  useEffect(() => { setCurrentPage(1); }, [filtroStato, filtroCategoryId, filtroPriorita, debouncedFiltroTitolo, debouncedFiltroLuogo, filtroDataStart, filtroDataScadenza, setCurrentPage]);

  const resetFiltri = () => {
    setFiltroStato('tutti'); setFiltroCategoryId(''); setFiltroPriorita('');
    setFiltroTitolo(''); setFiltroLuogo(''); setFiltroDataStart(''); setFiltroDataScadenza('');
    setCurrentPage(1);
  };

  const creaTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      titolo: form.titolo, descrizione: form.descrizione || null, data_start: form.data_start,
      data_scadenza: form.data_scadenza || null, priorita: form.priorita,
      category_id: form.category_id ? Number(form.category_id) : null, luogo: form.luogo || null, parent_id: null,
    };
    try {
      const res = await fetch(apiUrl('/tasks'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaderObj }, body: JSON.stringify(payload) });
      if (!res.ok) return;
      setForm(makeEmptyTaskForm(form.category_id));
      setCurrentPage(1);
      await fetchTasks();
      if (familyTaskId != null) fetchFamily(familyTaskId);
    } catch (err) {}
  };

  const toggleFatto = async (task: Task) => {
    try {
      const res = await fetch(apiUrl(`/tasks/${task.id}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaderObj }, body: JSON.stringify({ fatto: !task.fatto }) });
      if (!res.ok) return;
      await fetchTasks();
      if (familyTaskId != null) fetchFamily(familyTaskId);
    } catch (err) {}
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Vuoi davvero eliminare il task "${task.titolo}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/tasks/${task.id}`), { method: 'DELETE', headers: authHeaderObj });
      if (!res.ok) return;
      if (editingTaskId === task.id) setEditingTaskId(null);
      if (parentForSubtaskId === task.id) setParentForSubtaskId(null);
      if (familyTaskId === task.id) { setFamilyTaskId(null); setFamilyRoot(null); }
      await fetchTasks();
      if (familyTaskId != null && familyTaskId !== task.id) fetchFamily(familyTaskId);
    } catch (err) {}
  };

  const creaSubtaskInline = async (parentId: number) => {
    if (!subtaskForm.titolo || !subtaskForm.data_start) return;
    const payload = {
      titolo: subtaskForm.titolo, descrizione: null, data_start: subtaskForm.data_start,
      data_scadenza: subtaskForm.data_scadenza || null, priorita: subtaskForm.priorita, category_id: null, luogo: null, parent_id: parentId,
    };
    try {
      const res = await fetch(apiUrl('/tasks'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaderObj }, body: JSON.stringify(payload) });
      if (!res.ok) return;
      setSubtaskForm({ titolo: '', data_start: todayString(), data_scadenza: '', priorita: 'Media' });
      setParentForSubtaskId(null);
      await fetchTasks();
      if (familyTaskId != null) fetchFamily(familyTaskId);
    } catch (err) {}
  };

  const startEditTask = (task: Task) => {
    setParentForSubtaskId(null);
    setEditingTaskId(task.id);
    setEditForm({
      titolo: task.titolo, descrizione: task.descrizione || '', data_start: normalizeDate(task.data_start),
      data_scadenza: normalizeDate(task.data_scadenza), priorita: task.priorita,
      category_id: task.category_id ? String(task.category_id) : '', luogo: task.luogo || '', fatto: task.fatto,
    });
  };

  const saveEditTask = async (taskId: number) => {
    const payload = {
      titolo: editForm.titolo, descrizione: editForm.descrizione || null, data_start: editForm.data_start,
      data_scadenza: editForm.data_scadenza || null, priorita: editForm.priorita,
      category_id: editForm.category_id ? Number(editForm.category_id) : null, luogo: editForm.luogo || null, fatto: editForm.fatto,
    };
    try {
      const res = await fetch(apiUrl(`/tasks/${taskId}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaderObj }, body: JSON.stringify(payload) });
      if (!res.ok) return;
      setEditingTaskId(null);
      await fetchTasks();
      if (familyTaskId != null) fetchFamily(familyTaskId);
    } catch (err) {}
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
    <div style={{ display: 'flex', height: '100%', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ flex: 1, paddingRight: 24, borderRight: '1px solid #ddd' }}>
        <h1>Tasks</h1>
		<TaskCreateForm
			form={form}
			setForm={setForm}
			creaTask={creaTask}
			loading={loading}
			categories={categories}
			handleNuovaCategoria={handleNuovaCategoria}
		/>

		<TaskFilters
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
			loading={loading}
			categories={categories}
		/>

		<TaskListSection
			loading={loading}
			totalItems={totalItems}
			startIndex={startIndex}
			endIndex={endIndex}
			rowsPerPage={rowsPerPage}
			setRowsPerPage={setRowsPerPage}
			safeCurrentPage={safeCurrentPage}
			totalPages={totalPages}
			setCurrentPage={setCurrentPage}
			rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
			rowsContent={
				<TaskRows
					tasks={paginatedRootTasks}
					subtasksByParent={subtasksByParent}
					loading={loading}
					categories={categories}
					parentForSubtaskId={parentForSubtaskId}
					setParentForSubtaskId={setParentForSubtaskId}
					subtaskForm={subtaskForm}
					setSubtaskForm={setSubtaskForm}
					creaSubtaskInline={creaSubtaskInline}
					editingTaskId={editingTaskId}
					setEditingTaskId={setEditingTaskId}
					editForm={editForm}
					setEditForm={setEditForm}
					saveEditTask={saveEditTask}
					startEditTask={startEditTask}
					deleteTask={deleteTask}
					toggleFatto={toggleFatto}
					setFamilyTaskId={setFamilyTaskId}
					formatDateTime={formatDateTime}
				/>
			}
		/>
      </div>

      <TaskFamilyPanel
        familyTaskId={familyTaskId}
        familyRoot={familyRoot}
        loadingFamily={loadingFamily}
        toggleFatto={toggleFatto}
        setEditingTaskId={setEditingTaskId}
        setParentForSubtaskId={setParentForSubtaskId}
        setFamilyTaskId={setFamilyTaskId}
        formatDateTime={formatDateTime}
        loading={loading}
      />
    </div>
  );
};

export default TasksPage;
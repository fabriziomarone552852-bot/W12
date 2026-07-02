// src/views/EventsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

export interface Category {
  id: number;
  name: string;
  colore?: string | null;
  genre: number; // 1=Tasks, 2=Events, 3=Comuni
}

export interface Event {
  id: number;
  titolo: string;
  descrizione: string | null;
  data_inizio: string;
  data_fine: string | null;
  tutto_il_giorno: boolean;
  luogo: string | null;
  category_id: number | null;
  category_name?: string | null;
}

interface LocationState {
  createdCategory?: Category;
}

const todayString = () => new Date().toISOString().slice(0, 10);
const normalizeDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : '';

const makeEmptyEventForm = (defaultCategoryId: string = '') => ({
  titolo: '',
  descrizione: '',
  data_inizio: todayString(),
  data_fine: '',
  tutto_il_giorno: false,
  luogo: '',
  category_id: defaultCategoryId,
});

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const EventsPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(makeEmptyEventForm);

  const [filtroTitolo, setFiltroTitolo] = useState('');
  const [filtroDescrizione, setFiltroDescrizione] = useState('');
  const [filtroLuogo, setFiltroLuogo] = useState('');
  const [filtroCategoryId, setFiltroCategoryId] = useState('');
  const [filtroTuttoIlGiorno, setFiltroTuttoIlGiorno] = useState<
    'true' | 'false' | ''
  >('');
  const [filtroStartDate, setFiltroStartDate] = useState('');
  const [filtroEndDate, setFiltroEndDate] = useState('');

  const debouncedFiltroTitolo = useDebounce(filtroTitolo);
  const debouncedFiltroDescrizione = useDebounce(filtroDescrizione);
  const debouncedFiltroLuogo = useDebounce(filtroLuogo);

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    titolo: '',
    descrizione: '',
    data_inizio: '',
    data_fine: '',
    tutto_il_giorno: false,
    luogo: '',
    category_id: '',
  });

  const authHeaderObj = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    console.log('apiUrl("/events") test:', apiUrl('/events'));
  }, []);

  useEffect(() => {
    if (state.createdCategory) {
      const catId = String(state.createdCategory.id);
      setForm((p) => ({
        ...p,
        category_id: catId,
      }));
      setFiltroCategoryId(catId);
      console.log(
        'Categoria evento creata selezionata automaticamente:',
        state.createdCategory
      );
    }
  }, [state.createdCategory]);

  const fetchCategories = async () => {
    try {
      const url = apiUrl('/categories?genre=2');
      console.log('GET /categories events URL', url);

      const res = await fetch(url, {
        headers: authHeaderObj,
      });
      console.log('GET /categories events status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore /categories events, body:', text);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Risposta non JSON da /categories events:', text);
        return;
      }

      const data = await res.json();
      console.log('data /categories events', data);
      const list = Array.isArray(data) ? data : data.items ?? [];
      setCategories(list);
    } catch (err) {
      console.error('Exception in fetchCategories events', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (debouncedFiltroTitolo.trim())
        params.set('titolo', debouncedFiltroTitolo.trim());
      if (debouncedFiltroDescrizione.trim())
        params.set('descrizione', debouncedFiltroDescrizione.trim());
      if (debouncedFiltroLuogo.trim())
        params.set('luogo', debouncedFiltroLuogo.trim());
      if (filtroCategoryId) params.set('category_id', filtroCategoryId);
      if (filtroTuttoIlGiorno)
        params.set('tutto_il_giorno', filtroTuttoIlGiorno);
      if (filtroStartDate) params.set('start_date', filtroStartDate);
      if (filtroEndDate) params.set('end_date', filtroEndDate);

      const queryString = params.toString();
      const url = apiUrl(queryString ? `/events?${queryString}` : '/events');
      console.log('GET /events URL', url);

      const res = await fetch(url, {
        headers: authHeaderObj,
      });

      console.log('GET /events status', res.status);

      if (res.status === 304) {
        console.warn('GET /events returned 304 Not Modified, skip json()');
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        console.error('Errore /events, body:', text);
        setEvents([]);
        return;
      }

      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Risposta non JSON da /events:', text);
        console.error('Headers /events:', res.headers);
        setEvents([]);
        return;
      }

      const data = await res.json();
      console.log('data /events', data);

      const list = Array.isArray(data) ? data : data.items ?? [];
      setEvents(list);
    } catch (err) {
      console.error('Exception in fetchEvents', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [authHeaderObj]);

  useEffect(() => {
    fetchEvents();
  }, [
    debouncedFiltroTitolo,
    debouncedFiltroDescrizione,
    debouncedFiltroLuogo,
    filtroCategoryId,
    filtroTuttoIlGiorno,
    filtroStartDate,
    filtroEndDate,
    authHeaderObj,
  ]);

  // ⚠️ TEMPORANEO: Vecchia paginazione rimossa. Mostriamo tutto finché non refattorizziamo.
  const safeCurrentPage = 1;
  const setCurrentPage = () => {};
  const rowsPerPage = 50;
  const setRowsPerPage = () => {};
  const totalItems = events.length;
  const totalPages = 1;
  const startIndex = 0;
  const endIndex = events.length;
  const paginatedEvents = events; // Mostriamo tutti i dati temporaneamente

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedFiltroTitolo,
    debouncedFiltroDescrizione,
    debouncedFiltroLuogo,
    filtroCategoryId,
    filtroTuttoIlGiorno,
    filtroStartDate,
    filtroEndDate,
    setCurrentPage,
  ]);

  const resetFiltri = () => {
    setFiltroTitolo('');
    setFiltroDescrizione('');
    setFiltroLuogo('');
    setFiltroCategoryId('');
    setFiltroTuttoIlGiorno('');
    setFiltroStartDate('');
    setFiltroEndDate('');
    setCurrentPage(1);
    console.log(
      'Reset filtri eventi (fetchEvents verrà chiamato da useEffect)'
    );
  };

  const creaEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      titolo: form.titolo,
      descrizione: form.descrizione || null,
      data_inizio: form.data_inizio,
      data_fine: form.data_fine || null,
      tutto_il_giorno: form.tutto_il_giorno,
      luogo: form.luogo || null,
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    const url = apiUrl('/events');
    console.log('POST /events URL', url, 'payload', payload);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      console.log('POST /events status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore POST /events body:', text);
        return;
      }

      setForm(makeEmptyEventForm(form.category_id));
      setCurrentPage(1);
      await fetchEvents();
    } catch (err) {
      console.error('Exception in creaEvent', err);
    }
  };

  const updateEvent = async (event: Event, patch: Partial<Event>) => {
    const payload: any = {};

    if (patch.titolo !== undefined) payload.titolo = patch.titolo;
    if (patch.descrizione !== undefined) payload.descrizione = patch.descrizione;
    if (patch.data_inizio !== undefined) payload.data_inizio = patch.data_inizio;
    if (patch.data_fine !== undefined) payload.data_fine = patch.data_fine;
    if (patch.tutto_il_giorno !== undefined)
      payload.tutto_il_giorno = patch.tutto_il_giorno;
    if (patch.luogo !== undefined) payload.luogo = patch.luogo;
    if (patch.category_id !== undefined) payload.category_id = patch.category_id;

    const url = apiUrl(`/events/${event.id}`);
    console.log('PATCH /events URL', url, 'payload', payload);

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      console.log('PATCH /events status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore PATCH /events body:', text);
        return;
      }

      await fetchEvents();
    } catch (err) {
      console.error('Exception in updateEvent', err);
    }
  };

  const startEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    setEditForm({
      titolo: event.titolo,
      descrizione: event.descrizione || '',
      data_inizio: normalizeDate(event.data_inizio),
      data_fine: normalizeDate(event.data_fine),
      tutto_il_giorno: event.tutto_il_giorno,
      luogo: event.luogo || '',
      category_id: event.category_id ? String(event.category_id) : '',
    });
  };

  const saveEditEvent = async (eventId: number) => {
    const payload = {
      titolo: editForm.titolo,
      descrizione: editForm.descrizione || null,
      data_inizio: editForm.data_inizio,
      data_fine: editForm.data_fine || null,
      tutto_il_giorno: editForm.tutto_il_giorno,
      luogo: editForm.luogo || null,
      category_id: editForm.category_id
        ? Number(editForm.category_id)
        : null,
    };

    const url = apiUrl(`/events/${eventId}`);
    console.log('PATCH /events URL', url, 'payload', payload);

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      console.log('PATCH /events status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore PATCH /events body:', text);
        return;
      }

      setEditingEventId(null);
      await fetchEvents();
    } catch (err) {
      console.error('Exception in saveEditEvent', err);
    }
  };

  const deleteEvent = async (event: Event) => {
    const confirmed = window.confirm(
      `Vuoi davvero eliminare l'evento "${event.titolo}"?`
    );
    if (!confirmed) return;

    const url = apiUrl(`/events/${event.id}`);
    console.log('DELETE /events URL', url);

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: authHeaderObj,
      });

      console.log('DELETE /events status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore DELETE /events body:', text);
        return;
      }

      if (editingEventId === event.id) {
        setEditingEventId(null);
      }

      await fetchEvents();
    } catch (err) {
      console.error('Exception in deleteEvent', err);
    }
  };

  const handleNuovaCategoria = () => {
    navigate('/categories', {
      state: {
        from: 'events',
        genreHint: 2 as const,
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Eventi</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Nuovo evento</h2>
        <form
          onSubmit={creaEvent}
          style={{ display: 'grid', gap: 12, maxWidth: 900 }}
        >
          <div>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Titolo
            </label>
            <input
              value={form.titolo}
              onChange={(e) =>
                setForm((p) => ({ ...p, titolo: e.target.value }))
              }
              placeholder="Es. Riunione, Compleanno..."
              required
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
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
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
              >
                Data inizio
              </label>
              <input
                type="date"
                value={form.data_inizio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, data_inizio: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
              >
                Data fine
              </label>
              <input
                type="date"
                value={form.data_fine}
                onChange={(e) =>
                  setForm((p) => ({ ...p, data_fine: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
              >
                Tutto il giorno
              </label>
              <input
                type="checkbox"
                checked={form.tutto_il_giorno}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    tutto_il_giorno: e.target.checked,
                  }))
                }
              />
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
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
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
                style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
              >
                Luogo
              </label>
              <input
                value={form.luogo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, luogo: e.target.value }))
                }
                placeholder="Es. Ufficio, Sala riunioni..."
              />
            </div>
          </div>
          <button type="submit" disabled={loading}>
            Crea evento
          </button>
        </form>
      </section>

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
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
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
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Descrizione contiene
            </label>
            <input
              value={filtroDescrizione}
              onChange={(e) => setFiltroDescrizione(e.target.value)}
              placeholder="Testo nella descrizione"
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
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
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
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
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Tutto il giorno
            </label>
            <select
              value={filtroTuttoIlGiorno}
              onChange={(e) =>
                setFiltroTuttoIlGiorno(
                  e.target.value as 'true' | 'false' | ''
                )
              }
            >
              <option value="">Tutti</option>
              <option value="true">Solo tutto il giorno</option>
              <option value="false">Solo non tutto il giorno</option>
            </select>
          </div>

          <div>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Inizio da
            </label>
            <input
              type="date"
              value={filtroStartDate}
              onChange={(e) => setFiltroStartDate(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}
            >
              Fine entro
            </label>
            <input
              type="date"
              value={filtroEndDate}
              onChange={(e) => setFiltroEndDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={resetFiltri} disabled={loading}>
              Reset filtri
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>Elenco eventi</h2>

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
              ? 'Nessun evento trovato'
              : `Mostrando ${startIndex + 1}-${endIndex} di ${totalItems} eventi`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="rowsPerPageEvents">Righe per pagina</label>
            <select
              id="rowsPerPageEvents"
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
                  <th>Inizio</th>
                  <th>Fine</th>
                  <th>Tutto il giorno</th>
                  <th>Categoria</th>
                  <th>Luogo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((ev) => (
                  <React.Fragment key={ev.id}>
                    <tr>
                      <td>{ev.titolo}</td>
                      <td>{ev.descrizione || '-'}</td>
                      <td>{ev.data_inizio}</td>
                      <td>{ev.data_fine || '-'}</td>
                      <td>{ev.tutto_il_giorno ? 'Sì' : 'No'}</td>
                      <td>{ev.category_name || '-'}</td>
                      <td>{ev.luogo || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => startEditEvent(ev)}
                          disabled={loading}
                        >
                          Modifica
                        </button>
                        <button
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            updateEvent(ev, {
                              tutto_il_giorno: !ev.tutto_il_giorno,
                            })
                          }
                          disabled={loading}
                        >
                          Toggle giorno intero
                        </button>
                        <button
                          style={{ marginLeft: 8 }}
                          onClick={() => deleteEvent(ev)}
                          disabled={loading}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>

                    {editingEventId === ev.id && (
                      <tr>
                        <td colSpan={8} style={{ background: '#eef6ff' }}>
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
                                  value={editForm.data_inizio}
                                  onChange={(e) =>
                                    setEditForm((p) => ({
                                      ...p,
                                      data_inizio: e.target.value,
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
                                  Data fine
                                </label>
                                <input
                                  type="date"
                                  value={editForm.data_fine}
                                  onChange={(e) =>
                                    setEditForm((p) => ({
                                      ...p,
                                      data_fine: e.target.value,
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
                                  Tutto il giorno
                                </label>
                                <input
                                  type="checkbox"
                                  checked={editForm.tutto_il_giorno}
                                  onChange={(e) =>
                                    setEditForm((p) => ({
                                      ...p,
                                      tutto_il_giorno: e.target.checked,
                                    }))
                                  }
                                />
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

                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => saveEditEvent(ev.id)}
                                disabled={loading}
                              >
                                Salva modifiche
                              </button>
                              <button
                                onClick={() => setEditingEventId(null)}
                                disabled={loading}
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <nav
              aria-label="Paginazione eventi"
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
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={safeCurrentPage === 1 || loading}
                >
                  Precedente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage === totalPages || loading}
                >
                  Successiva
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </div>
  );
};

export default EventsPage;
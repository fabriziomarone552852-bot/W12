// src/views/CategoriesPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CategoryForm, { type CategoryFormValues } from '../components/CategoryForm';

export interface Category {
  id: number;
  name: string;
  colore?: string | null;
  genre: number; // 1=Tasks, 2=Events, 3=Comuni
}

interface LocationState {
  from?: 'tasks' | 'events';
  genreHint?: 1 | 2;
}

const CategoriesPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [categories, setCategories] = useState<Category[]>([]);
  const [genre, setGenre] = useState<number>(state.genreHint || 1);
  const [loading, setLoading] = useState(false);

  const authHeaderObj = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (state.genreHint === 1 || state.genreHint === 2) {
      setGenre(state.genreHint);
    }
  }, [state.genreHint]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (genre) params.set('genre', String(genre));
      const url = apiUrl(`/categories?${params.toString()}`);
      console.log('GET /categories URL', url);

      const res = await fetch(url, {
        headers: authHeaderObj,
      });
      console.log('GET /categories status', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Errore /categories body:', text);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Risposta non JSON da /categories:', text);
        return;
      }

      const data = await res.json();
      console.log('data /categories', data);

      const list = Array.isArray(data) ? data : data.items ?? [];
      setCategories(list);
    } catch (err) {
      console.error('Exception in fetchCategories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [authHeaderObj, genre]);

  const handleCreate = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      colore: values.colore || null,
      genre: values.genre,
    };

    const url = apiUrl('/categories');
    console.log('POST /categories URL', url, 'payload', payload);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      console.log('POST /categories status', res.status);
      const text = await res.text();
      console.log('POST /categories response text:', text);

      if (!res.ok) {
        console.error('Errore POST /categories body:', text);
        return;
      }

      const created = JSON.parse(text) as Category;

      if (state.from === 'tasks') {
        navigate('/tasks', {
          state: { createdCategory: created },
        });
        return;
      }
      if (state.from === 'events') {
        navigate('/events', {
          state: { createdCategory: created },
        });
        return;
      }

      await fetchCategories();
    } catch (err) {
      console.error('Exception in handleCreate', err);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Categorie</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Nuova categoria</h2>
        <CategoryForm mode="create" onSubmit={handleCreate} />
      </section>

      <section>
        <h2>Categorie esistenti</h2>
        {loading ? (
          <p>Caricamento...</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th>Nome</th>
                <th>Colore</th>
                <th>Tipo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    {c.colore ? (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: c.colore,
                          border: '1px solid #ccc',
                        }}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {c.genre === 1
                      ? 'Tasks'
                      : c.genre === 2
                      ? 'Events'
                      : 'Comune'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/categories/${c.id}/edit`);
                      }}
                    >
                      Modifica
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default CategoriesPage;
// src/views/CategoriesPage.tsx (Snippet aggiornato)
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi'; // <-- Importa il nuovo hook
import CategoryForm, { type CategoryFormValues } from '../components/CategoryForm';

export interface Category {
  id: number;
  name: string;
  colore?: string | null;
  genre: number; 
}

interface LocationState {
  from?: 'tasks' | 'events';
  genreHint?: 1 | 2;
}

const CategoriesPage: React.FC = () => {
  const { request } = useApi(); // <-- Usa l'hook! Addio useAuth e authHeaderObj ripetuti!
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [categories, setCategories] = useState<Category[]>([]);
  const [genre, setGenre] = useState<number>(state.genreHint || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.genreHint === 1 || state.genreHint === 2) {
      setGenre(state.genreHint);
    }
  }, [state.genreHint]);

  // Guarda quanto è pulita ora la fetch!
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (genre) params.set('genre', String(genre));
      
      const data = await request(`/categories?${params.toString()}`);
      
      const list = Array.isArray(data) ? data : data.items ?? [];
      setCategories(list);
    } catch (err) {
      // L'errore dettagliato viene già loggato dentro useApi
      alert('Impossibile caricare le categorie'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [genre, request]); // Aggiunto request alle dipendenze

  // E guarda come si semplifica il POST!
  const handleCreate = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      colore: values.colore || null,
      genre: values.genre,
    };

    try {
      const created = await request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (state.from === 'tasks') {
        navigate('/tasks', { state: { createdCategory: created } });
        return;
      }
      if (state.from === 'events') {
        navigate('/events', { state: { createdCategory: created } });
        return;
      }

      await fetchCategories();
    } catch (err) {
      alert("Errore durante la creazione della categoria");
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
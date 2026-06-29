import React, { useEffect, useState } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Category, CategoryCreatePayload } from '../types/categories';

const CategoriesPage: React.FC = () => {
  const { authHeaders } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [colore, setColore] = useState('');
  const [genre, setGenre] = useState<number>(3); // 1=tasks, 2=events, 3=entrambi

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/categories'), {
        headers: {
          ...authHeaders(),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore caricamento categorie');
      }

      const data = (await res.json()) as Category[];
      setCategories(data);
    } catch (e: any) {
      setError(e.message ?? 'Errore caricamento categorie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: CategoryCreatePayload = {
        name,
        colore: colore || null,
        genre,
      };

      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore creazione categoria');
      }

      setName('');
      setColore('');
      setGenre(3);

      await fetchCategories();
    } catch (e: any) {
      setError(e.message ?? 'Errore creazione categoria');
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Eliminare questa categoria?')) return;
    setError(null);
    try {
      const res = await fetch(apiUrl(`/categories/${id}`), {
        method: 'DELETE',
        headers: {
          ...authHeaders(),
        },
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Errore eliminazione categoria');
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e.message ?? 'Errore eliminazione categoria');
    }
  };

  return (
    <div>
      <h2>Categorie</h2>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Nuova categoria</h3>
        <form onSubmit={onCreate}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '0.35rem', width: 250 }}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Colore HEX (opzionale)</label>
            <input
              value={colore}
              onChange={(e) => setColore(e.target.value)}
              placeholder="#3498db"
              style={{ padding: '0.35rem', width: 250 }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Genere</label>
            <select
              value={genre}
              onChange={(e) => setGenre(Number(e.target.value))}
              style={{ padding: '0.35rem' }}
            >
              <option value={3}>Comune (tasks + eventi)</option>
              <option value={1}>Solo tasks</option>
              <option value={2}>Solo eventi</option>
            </select>
          </div>

          {error && (
            <div style={{ color: '#b91c1c', marginBottom: '0.5rem', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Crea categoria
          </button>
        </form>
      </section>

      <section>
        <h3>Elenco categorie</h3>
        {loading && <p>Caricamento...</p>}
        {!loading && categories.length === 0 && <p>Nessuna categoria disponibile.</p>}

        {!loading && categories.length > 0 && (
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              maxWidth: 700,
              backgroundColor: '#fff',
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>
                  Nome
                </th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>
                  Colore
                </th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>
                  Genere
                </th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>
                  Scope
                </th>
                <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{cat.name}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {cat.colore ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            marginRight: 6,
                            backgroundColor: cat.colore,
                            border: '1px solid #ccc',
                            verticalAlign: 'middle',
                          }}
                        />
                        <span>{cat.colore}</span>
                      </>
                    ) : (
                      <span style={{ color: '#6b7280' }}>Nessun colore</span>
                    )}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {cat.genre === 1
                      ? 'Solo tasks'
                      : cat.genre === 2
                      ? 'Solo eventi'
                      : 'Comune'}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {cat.user_id === null ? 'Globale' : 'Personale'}
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {cat.user_id !== null && (
                      <button
                        onClick={() => onDelete(cat.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 4,
                          border: '1px solid #dc2626',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        Elimina
                      </button>
                    )}
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
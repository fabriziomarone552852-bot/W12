// src/views/CategoryEditPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CategoryForm, { type CategoryFormValues } from '../components/CategoryForm';
import type { Category } from './CategoriesPage';

const CategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<CategoryFormValues | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const authHeaderObj = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) return;
      setLoading(true);
      try {
        const url = apiUrl(`/categories/${categoryId}`);
        console.log('GET /categories/{id} URL', url);

        const res = await fetch(url, {
          headers: authHeaderObj,
        });
        console.log('GET /categories/{id} status', res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error('Errore GET /categories/{id} body:', text);
          return;
        }

        const data = (await res.json()) as Category;
        setInitialValues({
          name: data.name,
          colore: data.colore || '#cccccc',
          genre: data.genre,
        });
      } catch (err) {
        console.error('Exception in fetchCategory', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, authHeaderObj]);

  const handleUpdate = async (values: CategoryFormValues) => {
    const payload: Partial<CategoryFormValues> = {
      name: values.name,
      colore: values.colore || undefined,
      genre: values.genre,
    };

    const url = apiUrl(`/categories/${categoryId}`);
    console.log('PATCH /categories/{id} URL', url, 'payload', payload);

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      console.log('PATCH /categories/{id} status', res.status);
      const text = await res.text();
      console.log('PATCH /categories/{id} response text:', text);

      if (!res.ok) {
        console.error('Errore PATCH /categories/{id} body:', text);
        return;
      }

      navigate('/categories');
    } catch (err) {
      console.error('Exception in handleUpdate', err);
    }
  };

  if (!categoryId) {
    return <p>ID categoria non valido.</p>;
  }

  if (loading || !initialValues) {
    return <p>Caricamento categoria...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Modifica categoria</h1>
      <CategoryForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleUpdate}
      />
      <button
        type="button"
        style={{ marginTop: 16 }}
        onClick={() => navigate(-1)}
      >
        Annulla
      </button>
    </div>
  );
};

export default CategoryEditPage;
// src/components/CategoryForm.tsx
import React, { useEffect, useState } from 'react';
import type { Category } from '../views/CategoriesPage';

export interface CategoryFormValues {
  name: string;
  colore: string;
  genre: number; // 1=Tasks, 2=Events, 3=Comuni
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialValues?: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
}

const defaultValues: CategoryFormValues = {
  name: '',
  colore: '#cccccc',
  genre: 1,
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  mode,
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = useState<CategoryFormValues>(defaultValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    } else {
      setValues(defaultValues);
    }
  }, [initialValues]);

  const handleChange =
    (field: keyof CategoryFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === 'genre' ? Number(e.target.value) : e.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        colore: values.colore || '#cccccc',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'grid', gap: 12, maxWidth: 500 }}
    >
      <div>
        <label
          style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Nome
        </label>
        <input
          value={values.name}
          onChange={handleChange('name')}
          placeholder="Es. Casa, Lavoro..."
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
          Colore
        </label>
        <input
          type="color"
          value={values.colore}
          onChange={handleChange('colore')}
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
          Tipo
        </label>
        <select
          value={values.genre}
          onChange={handleChange('genre')}
        >
          <option value={1}>Tasks</option>
          <option value={2}>Events</option>
          <option value={3}>Comune</option>
        </select>
      </div>

      <button type="submit" disabled={submitting}>
        {mode === 'create' ? 'Salva categoria' : 'Salva modifiche'}
      </button>
    </form>
  );
};

export default CategoryForm;
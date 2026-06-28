// src/views/UserSettingsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface UserSettings {
  id: number;
  username: string;
  email: string;
  max_subtask_depth_user: number | null;
}

interface SettingsForm {
  email: string;
  maxDepth: number | '';
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const UserSettingsPage: React.FC = () => {
  const { token } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>({
    email: '',
    maxDepth: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const authHeaderObj = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Carica impostazioni da /me/settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = apiUrl('/me/settings');
        console.log('GET /me/settings URL', url);

        const res = await fetch(url, {
          headers: authHeaderObj,
        });
        console.log('GET /me/settings status', res.status);

        const text = await res.text();
        console.log('GET /me/settings response:', text);

        if (!res.ok) {
          setError('Errore nel caricamento delle impostazioni.');
          return;
        }

        const data = JSON.parse(text) as UserSettings;
        setSettings(data);
        setForm({
          email: data.email,
          maxDepth:
            data.max_subtask_depth_user !== null
              ? data.max_subtask_depth_user
              : '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } catch (err) {
        console.error('Exception in fetchSettings', err);
        setError('Eccezione nel caricamento delle impostazioni.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authHeaderObj]);

  const handleChange =
    (field: keyof SettingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]:
          field === 'maxDepth' && value !== ''
            ? Number(value)
            : value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!settings) return;

    const payload: any = {};

    // Solo se è cambiata l'email
    if (form.email && form.email !== settings.email) {
      payload.email = form.email;
    }

    // Cambio limite nidificazione, se valorizzato
    if (form.maxDepth !== '') {
      payload.max_subtask_depth_user = form.maxDepth;
    }

    // Cambio password se almeno un campo è compilato
    if (
      form.currentPassword ||
      form.newPassword ||
      form.confirmNewPassword
    ) {
      payload.current_password = form.currentPassword;
      payload.new_password = form.newPassword;
      payload.confirm_new_password = form.confirmNewPassword;
    }

    if (Object.keys(payload).length === 0) {
      setSuccess('Nessuna modifica da salvare.');
      return;
    }

    setSaving(true);
    try {
      const url = apiUrl('/me/settings');
      console.log('PATCH /me/settings URL', url, 'payload', payload);

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaderObj,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log('PATCH /me/settings status', res.status, 'response', text);

      if (!res.ok) {
        setError(
          text || 'Errore nel salvataggio delle impostazioni.'
        );
        return;
      }

      const updated = JSON.parse(text) as UserSettings;
      setSettings(updated);
      setForm((prev) => ({
        ...prev,
        // aggiorno solo i campi persistenti, svuoto i campi password
        email: updated.email,
        maxDepth:
          updated.max_subtask_depth_user !== null
            ? updated.max_subtask_depth_user
            : '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
      setSuccess('Impostazioni salvate con successo.');
    } catch (err) {
      console.error('Exception in handleSubmit', err);
      setError('Eccezione nel salvataggio delle impostazioni.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Impostazioni utente</h1>
        <p>Caricamento...</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Impostazioni utente</h1>
      <p>
        Utente: <strong>{settings.username}</strong>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: 16, maxWidth: 500 }}
      >
        {/* Email */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
          />
        </div>

        {/* Max profondità sottotask */}
        <div>
          <label
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Profondità massima sottotask (utente)
          </label>
          <input
            type="number"
            min={1}
            max={15}
            value={form.maxDepth}
            onChange={handleChange('maxDepth')}
          />
          <small>
            Il valore effettivo sarà il minimo tra questo e il limite
            globale impostato dall&apos;admin.
          </small>
        </div>

        {/* Cambio password */}
        <fieldset
          style={{
            border: '1px solid #ccc',
            padding: 12,
            borderRadius: 4,
          }}
        >
          <legend>Cambia password</legend>

          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Password corrente
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={handleChange('currentPassword')}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Nuova password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={handleChange('newPassword')}
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
              Conferma nuova password
            </label>
            <input
              type="password"
              value={form.confirmNewPassword}
              onChange={handleChange('confirmNewPassword')}
            />
          </div>
        </fieldset>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : 'Salva impostazioni'}
        </button>
      </form>
    </div>
  );
};

export default UserSettingsPage;
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/services';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: user?.userInfo?.firstName ?? '',
    lastName: user?.userInfo?.lastName ?? '',
    city: user?.userInfo?.city ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer votre compte ? Cette action est irréversible (RGPD).')) return;
    await authApi.deleteAccount();
    logout();
    navigate('/');
  };

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase() || user?.email[0].toUpperCase();

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg)', fontFamily: 'Sora, sans-serif' };

  return (
    <div className="container page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem' }}>Mon Profil</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(240px, 28%, 300px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sidebar */}
        <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px', textAlign: 'center' }}>
          <div style={{ width: '88px', height: '88px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--green)', margin: '0 auto 16px', border: '3px solid var(--green-light)' }}>
            {initials}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.3rem' }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 20px' }}>
            {user?.role === 'ADMIN' ? '⚙️ Administrateur' : '👤 Utilisateur'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)' }}>—</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Entrées</div>
            </div>
            <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)' }}>—</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Jours actifs</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div>
          <form onSubmit={handleSave}>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Informations personnelles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Prénom</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Nom</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email</label>
                <input type="email" value={user?.email} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Ville</label>
                <input name="city" value={form.city} onChange={handleChange} style={inputStyle} placeholder="Paris" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" disabled={saving}
                  style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
                {saved && <span style={{ color: 'var(--green)', fontSize: '0.88rem', fontWeight: 600 }}>✅ Profil mis à jour !</span>}
              </div>
            </div>
          </form>

          {/* Danger zone */}
          <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid #FFD0D0', padding: '28px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--danger)' }}>Zone de danger</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              La suppression de votre compte entraîne l'effacement irréversible de toutes vos données conformément au RGPD.
            </p>
            <button onClick={handleDelete}
              style={{ padding: '10px 20px', borderRadius: '10px', background: '#FFE8E8', color: 'var(--danger)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
              🗑️ Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

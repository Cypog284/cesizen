import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi, trackerApi } from '../api/services';
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

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [streak, setStreak] = useState<number | null>(null);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);

  useEffect(() => {
    trackerApi.getStreak().then(r => setStreak(r.streak)).catch(() => {});
    trackerApi.getReport().then(r => setTotalEntries(r.totalEntries)).catch(() => {});
  }, []);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ type: 'err', text: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authApi.changePassword(pwForm.current, pwForm.next);
      setPwMsg({ type: 'ok', text: '✅ Mot de passe mis à jour !' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      setPwMsg({ type: 'err', text: e.response?.data?.error ?? 'Erreur lors du changement.' });
    } finally {
      setPwSaving(false);
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
  const labelStyle = { display: 'block' as const, fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' };
  const roleLabel = user?.role === 'SUPER_ADMIN' ? '⭐ Super Administrateur' : user?.role === 'ADMIN' ? '⚙️ Administrateur' : '👤 Utilisateur';

  return (
    <div className="container page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem' }}>Mon Profil</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(240px, 28%, 300px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sidebar */}
        <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px', textAlign: 'center' }}>
          <div style={{ width: '88px', height: '88px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--green)', margin: '0 auto 16px', border: '3px solid var(--green-light)' }}>
            {initials}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.3rem' }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 20px' }}>{roleLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--green)' }}>{totalEntries ?? '—'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Entrées (mois)</div>
            </div>
            <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--green)' }}>
                {streak !== null ? `${streak}🔥` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Jours consécutifs</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleSave}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Informations personnelles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={user?.email} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Ville</label>
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

          <form onSubmit={handleChangePassword}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '28px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Changer le mot de passe</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Mot de passe actuel</label>
                  <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} style={inputStyle} placeholder="••••••••" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Nouveau mot de passe</label>
                    <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} style={inputStyle} placeholder="8 caractères min." />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmation</label>
                    <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} style={inputStyle} placeholder="••••••••" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" disabled={pwSaving}
                  style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {pwSaving ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
                {pwMsg && (
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: pwMsg.type === 'ok' ? 'var(--green)' : 'var(--danger)' }}>
                    {pwMsg.text}
                  </span>
                )}
              </div>
            </div>
          </form>

          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid #FFD0D0', padding: '28px' }}>
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

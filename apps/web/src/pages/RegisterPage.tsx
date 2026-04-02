import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/services';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authApi.register(form);
      await login(form.email, form.password);
      navigate('/tracker');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg)' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
      <div style={{ background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.7rem', textAlign: 'center', marginBottom: '6px' }}>Créer un compte</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '28px' }}>Rejoignez la communauté CESIZen</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Prénom</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required style={inputStyle} placeholder="Prénom" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Nom</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required style={inputStyle} placeholder="Nom" />
            </div>
          </div>
          {(['email', 'password', 'city'] as const).map(field => (
            <div key={field} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'capitalize' }}>
                {field === 'email' ? 'Email' : field === 'password' ? 'Mot de passe (8 caractères min.)' : 'Ville (optionnel)'}
              </label>
              <input name={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]} onChange={handleChange} required={field !== 'city'} style={inputStyle} />
            </div>
          ))}
          <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            🔒 Données protégées RGPD · Hébergement EU uniquement
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Déjà un compte ? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

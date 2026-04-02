import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('user@cesizen.fr');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/tracker');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
      <div style={{ background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <svg viewBox="0 0 40 40" fill="none" width="52" height="52">
            <circle cx="20" cy="8" r="5" fill="#52B788"/>
            <rect x="15" y="14" width="10" height="10" rx="2" transform="rotate(45 20 19)" fill="#2D6A4F"/>
            <path d="M10 30 Q20 22 30 30" stroke="#52B788" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.7rem', textAlign: 'center', marginBottom: '6px' }}>Connexion</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '28px' }}>Connectez-vous à votre espace CESIZen</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg)' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg)' }} />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px', background: '#FFE8E8', padding: '10px', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '12px 16px', marginTop: '16px', fontSize: '0.8rem' }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--green)' }}>Comptes de démonstration :</strong>
          • Utilisateur : user@cesizen.fr / password<br/>
          • Admin : admin@cesizen.fr / password
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Pas encore de compte ? <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

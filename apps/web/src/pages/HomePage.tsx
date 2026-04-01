import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-enter">
      {/* HERO */}
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '60px 24px',
        background: 'radial-gradient(ellipse at 30% 20%, #D8F3DC 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #B7E4C7 0%, transparent 50%), var(--bg)',
      }}>
        <div style={{ background: 'var(--green-pale)', color: 'var(--green)', fontSize: '0.8rem', fontWeight: 600, padding: '6px 16px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px', border: '1px solid var(--border)' }}>
          🏥 Projet gouvernemental · Ministère de la Santé
        </div>

        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', lineHeight: 1.1, marginBottom: '20px', maxWidth: '700px' }}>
          Prenez soin de votre <span style={{ color: 'var(--green)', fontStyle: 'italic' }}>santé mentale</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.7, marginBottom: '40px' }}>
          CESIZen vous accompagne au quotidien dans la gestion du stress et l'amélioration de votre bien-être émotionnel.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate(user ? '/tracker' : '/register')}
            style={{ padding: '14px 28px', borderRadius: '12px', background: 'var(--green)', color: 'white', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,106,79,0.3)' }}>
            {user ? 'Mon Tracker →' : 'Commencer gratuitement'}
          </button>
          <button onClick={() => navigate('/informations')}
            style={{ padding: '14px 28px', borderRadius: '12px', background: 'white', color: 'var(--green)', border: '2px solid var(--border)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
            📚 Découvrir les ressources
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '48px', marginTop: '64px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { num: '10 000+', label: 'Utilisateurs actifs' },
            { num: '500K+', label: 'Émotions suivies' },
            { num: '50+', label: 'Ressources disponibles' },
            { num: '98%', label: 'Satisfaction' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{s.num}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>Fonctionnalités principales</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '48px' }}>Des outils simples et efficaces pour mieux comprendre et gérer vos émotions.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { icon: '📊', bg: 'var(--green-pale)', title: 'Tracker d\'émotions', desc: 'Suivez vos émotions au quotidien avec un journal de bord structuré et visualisez vos tendances sur le long terme.' },
            { icon: '📚', bg: '#FEF0E7', title: 'Ressources de prévention', desc: 'Accédez à des contenus de qualité sur la santé mentale, les techniques de respiration et les activités de détente.' },
            { icon: '🔒', bg: '#EEF4FF', title: 'Données sécurisées', desc: 'Vos données sont protégées conformément au RGPD, hébergées exclusivement en Union Européenne.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'white', borderRadius: 'var(--radius)', padding: '28px', border: '1px solid var(--border)', transition: 'var(--transition)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: 'var(--green)', color: 'white', borderRadius: '20px', padding: '48px 32px', marginTop: '48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', marginBottom: '12px' }}>Rejoignez notre communauté</h2>
          <p style={{ opacity: 0.85, marginBottom: '24px' }}>Commencez votre parcours vers un meilleur équilibre émotionnel dès aujourd'hui.</p>
          <button onClick={() => navigate('/register')}
            style={{ padding: '14px 28px', borderRadius: '12px', background: 'white', color: 'var(--green)', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
            Créer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}

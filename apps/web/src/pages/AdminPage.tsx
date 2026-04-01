import { useState, useEffect } from 'react';
import { adminApi, pagesApi, emotionsApi } from '../api/services';
import { User, PageInfo, Emotion, DashboardStats } from '../types';

type AdminSection = 'dashboard' | 'pages' | 'emotions' | 'users';

const SIDEBAR_ITEMS: { key: AdminSection; icon: string; label: string }[] = [
  { key: 'dashboard', icon: '📊', label: 'Tableau de bord' },
  { key: 'pages', icon: '📄', label: 'Pages d\'information' },
  { key: 'emotions', icon: '💚', label: 'Émotions' },
  { key: 'users', icon: '👥', label: 'Utilisateurs' },
];

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard().then(setStats),
      pagesApi.getAll().then(setPages),
      emotionsApi.getAll().then(setEmotions),
      adminApi.getUsers().then(setUsers),
    ]).finally(() => setLoading(false));
  }, []);

  const handleDeletePage = async (id: string) => {
    if (!confirm('Supprimer cette page ?')) return;
    await pagesApi.delete(id);
    setPages(p => p.filter(x => x.id !== id));
  };

  const handleTogglePublish = async (page: PageInfo) => {
    const updated = await pagesApi.update(page.id, { isPublished: !page.isPublished });
    setPages(p => p.map(x => x.id === page.id ? updated : x));
  };

  const handleDeleteEmotion = async (id: string) => {
    if (!confirm('Supprimer cette émotion ?')) return;
    await emotionsApi.delete(id);
    setEmotions(e => e.filter(x => x.id !== id));
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ? (RGPD - soft delete)')) return;
    await adminApi.deleteUser(id);
    setUsers(u => u.filter(x => x.id !== id));
  };

  const thStyle = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' };
  const tdStyle = { padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' };
  const badge = (text: string, color: string, bg: string) => (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color, background: bg }}>{text}</span>
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>Chargement…</div>;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', flexShrink: 0, background: 'var(--green)', paddingTop: '16px' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)', marginBottom: '8px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Administration</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>CESIZen</div>
        </div>
        {SIDEBAR_ITEMS.map(item => (
          <div key={item.key} onClick={() => setSection(item.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', cursor: 'pointer', transition: 'var(--transition)', background: section === item.key ? 'rgba(255,255,255,0.12)' : 'transparent', color: section === item.key ? 'white' : 'rgba(255,255,255,0.65)', fontSize: '0.88rem', fontWeight: 500 }}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div className="page-enter">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', marginBottom: '20px' }}>Tableau de bord</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { icon: '👥', num: stats?.users.toLocaleString(), label: 'Utilisateurs actifs' },
                { icon: '📄', num: stats?.pages, label: 'Ressources publiées' },
                { icon: '💚', num: stats?.emotions, label: 'Émotions configurées' },
                { icon: '📝', num: stats?.entries.toLocaleString(), label: 'Entrées totales' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{s.num}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Derniers utilisateurs inscrits</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Utilisateur</th><th style={thStyle}>Email</th><th style={thStyle}>Rôle</th><th style={thStyle}>Inscrit le</th></tr></thead>
                <tbody>
                  {users.slice(0, 5).map(u => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.userInfo?.firstName} {u.userInfo?.lastName}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{badge(u.role, u.role === 'ADMIN' ? 'var(--green)' : '#888', u.role === 'ADMIN' ? 'var(--green-pale)' : '#F0F0F0')}</td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGES */}
        {section === 'pages' && (
          <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Gestion des pages d'information</h3>
              <button style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Nouvelle page
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Titre</th><th style={thStyle}>Catégorie</th><th style={thStyle}>Statut</th><th style={thStyle}>Modifié le</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {pages.map(p => (
                    <tr key={p.id}>
                      <td style={tdStyle}><strong>{p.title}</strong></td>
                      <td style={tdStyle}>{badge(p.category, p.category === 'PREVENTION' ? 'var(--green)' : 'var(--accent2)', p.category === 'PREVENTION' ? 'var(--green-pale)' : '#FEF0E7')}</td>
                      <td style={tdStyle}>{badge(p.isPublished ? 'Publié' : 'Brouillon', p.isPublished ? 'var(--green)' : '#888', p.isPublished ? 'var(--green-pale)' : '#F0F0F0')}</td>
                      <td style={tdStyle}>{new Date(p.updatedAt).toLocaleDateString('fr-FR')}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleTogglePublish(p)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--green-pale)', color: 'var(--green)' }}>
                            {p.isPublished ? 'Dépublier' : 'Publier'}
                          </button>
                          <button onClick={() => handleDeletePage(p.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FFE8E8', color: 'var(--danger)' }}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMOTIONS */}
        {section === 'emotions' && (
          <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Référentiel d'émotions (hiérarchie niveau 1 & 2)</h3>
              <button style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Ajouter
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Émotion (Niv. 1)</th><th style={thStyle}>Sous-émotions (Niv. 2)</th><th style={thStyle}>Couleur</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {emotions.map(em => (
                    <tr key={em.id}>
                      <td style={tdStyle}><strong>{em.label}</strong></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {em.children?.map(c => (
                            <span key={c.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', background: 'var(--bg)', border: '1px solid var(--border)' }}>{c.label}</span>
                          ))}
                        </div>
                      </td>
                      <td style={tdStyle}><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: em.color, border: '2px solid var(--border)' }} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--green-pale)', color: 'var(--green)' }}>Modifier</button>
                          <button onClick={() => handleDeleteEmotion(em.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FFE8E8', color: 'var(--danger)' }}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS */}
        {section === 'users' && (
          <div className="page-enter">
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>Gestion des utilisateurs</h3>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Nom</th><th style={thStyle}>Email</th><th style={thStyle}>Rôle</th><th style={thStyle}>Inscrit le</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.userInfo?.firstName} {u.userInfo?.lastName}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{badge(u.role, u.role === 'ADMIN' ? 'var(--green)' : '#888', u.role === 'ADMIN' ? 'var(--green-pale)' : '#F0F0F0')}</td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={tdStyle}>
                        {u.role !== 'ADMIN' && (
                          <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FFE8E8', color: 'var(--danger)' }}>
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

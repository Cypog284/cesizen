import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminApi, pagesApi, emotionsApi } from '../api/services';
import { User, PageInfo, Emotion, DashboardStats, PageCategory } from '../types';

type AdminSection = 'dashboard' | 'pages' | 'emotions' | 'users' | 'analytics';

const SIDEBAR_ITEMS: { key: AdminSection; icon: string; label: string }[] = [
  { key: 'dashboard', icon: '📊', label: 'Tableau de bord' },
  { key: 'pages', icon: '📄', label: 'Pages d\'information' },
  { key: 'emotions', icon: '💚', label: 'Émotions' },
  { key: 'users', icon: '👥', label: 'Utilisateurs' },
  { key: 'analytics', icon: '📈', label: 'Analytiques' },
];

const CATEGORIES: PageCategory[] = ['PREVENTION', 'EXERCISE', 'INFORMATION'];
const CATEGORY_LABELS: Record<PageCategory, string> = { PREVENTION: 'Prévention', EXERCISE: 'Exercice', INFORMATION: 'Information' };

const thStyle = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' };
const tdStyle = { padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' as const, marginBottom: '14px', fontFamily: 'inherit' };
const labelStyle = { display: 'block' as const, fontWeight: 600, fontSize: '0.82rem', marginBottom: '5px', color: 'var(--text-muted)' };

function roleBadge(role: string) {
  if (role === 'SUPER_ADMIN') return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', background: '#F3E8FF' }}>⭐ Super Admin</span>;
  if (role === 'ADMIN') return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', background: 'var(--green-pale)' }}>⚙️ Admin</span>;
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: '#888', background: '#F0F0F0' }}>👤 User</span>;
}

// ── Modal générique
function Modal({ title, onClose, children, maxWidth = '520px' }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── SVG Line Chart (registrations)
function RegistrationsChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 600, H = 160, padX = 40, padY = 20;
  const w = W - padX * 2, h = H - padY * 2;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * w,
    y: padY + h - (d.count / maxVal) * h,
    ...d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(padY + h).toFixed(1)} L${pts[0].x.toFixed(1)},${(padY + h).toFixed(1)} Z`;
  const ticks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {ticks.map(t => {
        const y = padY + h - (t / maxVal) * h;
        return <g key={t}><line x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeDasharray="4 3" /><text x={padX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{t}</text></g>;
      })}
      {data.filter((_, i) => i % 7 === 0 || i === data.length - 1).map((d, _, arr) => {
        const idx = data.indexOf(d);
        const p = pts[idx];
        const label = new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        return <text key={d.date} x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{label}</text>;
      })}
      <path d={areaD} fill="var(--green)" opacity={0.08} />
      <path d={pathD} fill="none" stroke="var(--green)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(p => <circle key={p.date} cx={p.x} cy={p.y} r={p.count > 0 ? 3 : 2} fill={p.count > 0 ? 'var(--green)' : 'var(--border)'} />)}
    </svg>
  );
}

// ── Horizontal Bar Chart (top emotions)
function EmotionBarChart({ data }: { data: { label: string; color: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '120px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: '100px', height: '14px', overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / max) * 100}%`, background: d.color, height: '100%', borderRadius: '100px', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ width: '36px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>{d.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Analytics
  const [analytics, setAnalytics] = useState<{
    registrations: { date: string; count: number }[];
    topEmotions: { label: string; color: string; count: number }[];
    avgIntensity: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Page modal
  const [pageModal, setPageModal] = useState<'create' | 'edit' | null>(null);
  const [editingPage, setEditingPage] = useState<PageInfo | null>(null);
  const [pageForm, setPageForm] = useState({ title: '', content: '', category: 'INFORMATION' as PageCategory });
  const [pageLoading, setPageLoading] = useState(false);

  // ── Emotion modal
  const [emotionModal, setEmotionModal] = useState<'create' | 'edit' | null>(null);
  const [editingEmotion, setEditingEmotion] = useState<Emotion | null>(null);
  const [emotionForm, setEmotionForm] = useState({ label: '', color: '#2d6a4f', level: 1, parentId: '' });
  const [subEmotions, setSubEmotions] = useState<{ label: string; color: string }[]>([]);
  const [emotionLoading, setEmotionLoading] = useState(false);

  // ── User profile modal
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);

  // ── Role change
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard().then(setStats),
      pagesApi.getAll().then(setPages),
      emotionsApi.getAll().then(setEmotions),
      adminApi.getUsers().then(setUsers),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (section === 'analytics' && !analytics) {
      setAnalyticsLoading(true);
      adminApi.getAnalytics().then(setAnalytics).catch(() => {}).finally(() => setAnalyticsLoading(false));
    }
  }, [section]);

  // ── Role change handler
  const handleRoleChange = async (targetUser: User, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    setRoleLoading(targetUser.id);
    try {
      await adminApi.updateRole(targetUser.id, newRole);
      setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, role: newRole } : x));
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Erreur lors du changement de rôle.');
    } finally {
      setRoleLoading(null);
    }
  };

  // Can the current user change target user's role?
  function canChangeRole(target: User): boolean {
    if (!currentUser) return false;
    if (target.id === currentUser.id) return false; // can't change own role
    if (currentUser.role === 'ADMIN') {
      if (target.role === 'SUPER_ADMIN') return false; // can't touch SUPER_ADMIN
    }
    return true;
  }

  // What roles can the current user assign to a target?
  function assignableRoles(target: User): Array<'USER' | 'ADMIN'> {
    if (currentUser?.role === 'SUPER_ADMIN') return ['USER', 'ADMIN'];
    return ['USER', 'ADMIN']; // ADMIN can also do USER/ADMIN but not SUPER_ADMIN
  }

  // ── User profile modal
  async function openUserProfile(userId: string) {
    setUserProfileLoading(true);
    setUserProfile({});
    try {
      const data = await adminApi.getUserById(userId);
      setUserProfile(data);
    } catch {
      setUserProfile(null);
    } finally {
      setUserProfileLoading(false);
    }
  }

  // ── Pages handlers
  const handleDeletePage = async (id: string) => {
    if (!confirm('Supprimer cette page ?')) return;
    await pagesApi.delete(id);
    setPages(p => p.filter(x => x.id !== id));
  };

  const handleTogglePublish = async (page: PageInfo) => {
    const updated = await pagesApi.update(page.id, { isPublished: !page.isPublished });
    setPages(p => p.map(x => x.id === page.id ? updated : x));
  };

  function openCreatePage() {
    setPageForm({ title: '', content: '', category: 'INFORMATION' });
    setEditingPage(null);
    setPageModal('create');
  }

  function openEditPage(page: PageInfo) {
    setPageForm({ title: page.title, content: page.content, category: page.category });
    setEditingPage(page);
    setPageModal('edit');
  }

  async function handleSubmitPage() {
    if (!pageForm.title.trim() || !pageForm.content.trim()) return alert('Titre et contenu requis.');
    setPageLoading(true);
    try {
      if (pageModal === 'create') {
        const created = await pagesApi.create({ title: pageForm.title, content: pageForm.content, category: pageForm.category });
        setPages(p => [...p, created]);
      } else if (editingPage) {
        const updated = await pagesApi.update(editingPage.id, pageForm);
        setPages(p => p.map(x => x.id === editingPage.id ? updated : x));
      }
      setPageModal(null);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setPageLoading(false);
    }
  }

  // ── Emotions handlers
  const handleDeleteEmotion = async (id: string) => {
    if (!confirm('Supprimer cette émotion ?')) return;
    await emotionsApi.delete(id);
    setEmotions(e => e.filter(x => x.id !== id));
  };

  function openCreateEmotion() {
    setEmotionForm({ label: '', color: '#2d6a4f', level: 1, parentId: '' });
    setSubEmotions([]);
    setEditingEmotion(null);
    setEmotionModal('create');
  }

  function openEditEmotion(emotion: Emotion) {
    setEmotionForm({ label: emotion.label, color: emotion.color, level: emotion.level, parentId: emotion.parentId ?? '' });
    setSubEmotions(emotion.children?.map(c => ({ label: c.label, color: c.color })) ?? []);
    setEditingEmotion(emotion);
    setEmotionModal('edit');
  }

  function addSubEmotion() { setSubEmotions(s => [...s, { label: '', color: emotionForm.color }]); }
  function updateSubEmotion(index: number, field: 'label' | 'color', value: string) {
    setSubEmotions(s => s.map((sub, i) => i === index ? { ...sub, [field]: value } : sub));
  }
  function removeSubEmotion(index: number) { setSubEmotions(s => s.filter((_, i) => i !== index)); }

  async function handleSubmitEmotion() {
    if (!emotionForm.label.trim()) return alert('Le libellé est requis.');
    if (emotionForm.level === 2 && !emotionForm.parentId) return alert('Sélectionnez une émotion parente.');
    if (subEmotions.find(s => !s.label.trim())) return alert('Tous les libellés de sous-émotions doivent être remplis.');
    setEmotionLoading(true);
    try {
      const payload = {
        label: emotionForm.label,
        color: emotionForm.color,
        level: emotionForm.level,
        parentId: emotionForm.level === 2 && emotionForm.parentId ? emotionForm.parentId : undefined,
      };
      if (emotionModal === 'create') {
        const created = await emotionsApi.create(payload);
        if (emotionForm.level === 1 && subEmotions.length > 0) {
          await Promise.all(subEmotions.map(sub =>
            emotionsApi.create({ label: sub.label, color: sub.color, level: 2, parentId: created.id })
          ));
        }
      } else if (editingEmotion) {
        await emotionsApi.update(editingEmotion.id, payload);
        if (emotionForm.level === 1) {
          const existingLabels = editingEmotion.children?.map(c => c.label) ?? [];
          const newSubs = subEmotions.filter(s => !existingLabels.includes(s.label));
          if (newSubs.length > 0) {
            await Promise.all(newSubs.map(sub =>
              emotionsApi.create({ label: sub.label, color: sub.color, level: 2, parentId: editingEmotion.id })
            ));
          }
        }
      }
      const updated = await emotionsApi.getAll();
      setEmotions(updated);
      setEmotionModal(null);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setEmotionLoading(false);
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ? (RGPD - soft delete)')) return;
    await adminApi.deleteUser(id);
    setUsers(u => u.filter(x => x.id !== id));
  };

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
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', cursor: 'pointer', background: section === item.key ? 'rgba(255,255,255,0.12)' : 'transparent', color: section === item.key ? 'white' : 'rgba(255,255,255,0.65)', fontSize: '0.88rem', fontWeight: 500 }}>
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
                <div key={s.label} style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{s.num}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Derniers utilisateurs inscrits</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Utilisateur</th><th style={thStyle}>Email</th><th style={thStyle}>Rôle</th><th style={thStyle}>Inscrit le</th></tr></thead>
                <tbody>
                  {users.slice(0, 5).map(u => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.userInfo?.firstName} {u.userInfo?.lastName}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{roleBadge(u.role)}</td>
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
              <button onClick={openCreatePage} style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Nouvelle page
              </button>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Titre</th><th style={thStyle}>Catégorie</th><th style={thStyle}>Statut</th><th style={thStyle}>Modifié le</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {pages.map(p => (
                    <tr key={p.id}>
                      <td style={tdStyle}><strong>{p.title}</strong></td>
                      <td style={tdStyle}><span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: p.category === 'PREVENTION' ? 'var(--green)' : 'var(--accent2)', background: p.category === 'PREVENTION' ? 'var(--green-pale)' : '#FEF0E7' }}>{CATEGORY_LABELS[p.category]}</span></td>
                      <td style={tdStyle}><span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: p.isPublished ? 'var(--green)' : '#888', background: p.isPublished ? 'var(--green-pale)' : '#F0F0F0' }}>{p.isPublished ? 'Publié' : 'Brouillon'}</span></td>
                      <td style={tdStyle}>{new Date(p.updatedAt).toLocaleDateString('fr-FR')}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEditPage(p)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#EEF2FF', color: '#4F46E5' }}>Modifier</button>
                          <button onClick={() => handleTogglePublish(p)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--green-pale)', color: 'var(--green)' }}>{p.isPublished ? 'Dépublier' : 'Publier'}</button>
                          <button onClick={() => handleDeletePage(p.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FFE8E8', color: 'var(--danger)' }}>Supprimer</button>
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
              <button onClick={openCreateEmotion} style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>+ Ajouter</button>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
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
                          <button onClick={() => openEditEmotion(em)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#EEF2FF', color: '#4F46E5' }}>Modifier</button>
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
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={thStyle}>Nom</th><th style={thStyle}>Email</th><th style={thStyle}>Rôle</th><th style={thStyle}>Inscrit le</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ background: u.id === currentUser?.id ? 'rgba(45,106,79,0.03)' : undefined }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                            {`${u.userInfo?.firstName?.[0] ?? ''}${u.userInfo?.lastName?.[0] ?? ''}`.toUpperCase() || u.email[0].toUpperCase()}
                          </div>
                          <span>{u.userInfo?.firstName} {u.userInfo?.lastName}</span>
                          {u.id === currentUser?.id && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>(vous)</span>}
                        </div>
                      </td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{roleBadge(u.role)}</td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => openUserProfile(u.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#F0F9F4', color: 'var(--green)' }}>
                            Profil
                          </button>
                          {canChangeRole(u) && assignableRoles(u).map(role => role !== u.role && (
                            <button key={role} disabled={roleLoading === u.id}
                              onClick={() => handleRoleChange(u, role)}
                              style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: role === 'ADMIN' ? '#EEF2FF' : '#F0F0F0', color: role === 'ADMIN' ? '#4F46E5' : '#666', opacity: roleLoading === u.id ? 0.6 : 1 }}>
                              {role === 'ADMIN' ? '→ Admin' : '→ User'}
                            </button>
                          ))}
                          {currentUser?.role === 'SUPER_ADMIN' && u.role !== 'SUPER_ADMIN' && u.id !== currentUser?.id && (
                            <button disabled={roleLoading === u.id}
                              onClick={() => handleRoleChange(u, 'SUPER_ADMIN')}
                              style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#F3E8FF', color: '#7C3AED', opacity: roleLoading === u.id ? 0.6 : 1 }}>
                              → Super Admin
                            </button>
                          )}
                          {u.role !== 'SUPER_ADMIN' && u.id !== currentUser?.id && (
                            <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FFE8E8', color: 'var(--danger)' }}>
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {section === 'analytics' && (
          <div className="page-enter">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', marginBottom: '20px' }}>Analytiques</h2>
            {analyticsLoading || !analytics ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Chargement des données…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Avg intensity stat */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📊</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{analytics.avgIntensity}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>Intensité moyenne globale</div>
                  </div>
                  <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🎭</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{analytics.topEmotions.length}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>Émotions enregistrées</div>
                  </div>
                  <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: 'var(--green)' }}>{analytics.registrations.reduce((a, b) => a + b.count, 0)}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>Inscriptions sur 30 jours</div>
                  </div>
                </div>

                {/* Registrations chart */}
                <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px' }}>Inscriptions — 30 derniers jours</div>
                  <RegistrationsChart data={analytics.registrations} />
                </div>

                {/* Top emotions */}
                <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px' }}>Top émotions (global)</div>
                  {analytics.topEmotions.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucune donnée disponible.</p>
                    : <EmotionBarChart data={analytics.topEmotions} />
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal Nouvelle / Modifier Page */}
      {pageModal && (
        <Modal title={pageModal === 'create' ? 'Nouvelle page' : 'Modifier la page'} onClose={() => setPageModal(null)}>
          <label style={labelStyle}>Titre *</label>
          <input style={inputStyle} value={pageForm.title} onChange={e => setPageForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la page" />
          <label style={labelStyle}>Catégorie *</label>
          <select style={inputStyle} value={pageForm.category} onChange={e => setPageForm(f => ({ ...f, category: e.target.value as PageCategory }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <label style={labelStyle}>Contenu *</label>
          <textarea style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }} value={pageForm.content} onChange={e => setPageForm(f => ({ ...f, content: e.target.value }))} placeholder="Contenu de la page (Markdown supporté)" />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={() => setPageModal(null)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Annuler</button>
            <button onClick={handleSubmitPage} disabled={pageLoading} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--green)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: pageLoading ? 0.7 : 1 }}>
              {pageLoading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Nouvelle / Modifier Émotion */}
      {emotionModal && (
        <Modal title={emotionModal === 'create' ? 'Ajouter une émotion' : 'Modifier l\'émotion'} onClose={() => setEmotionModal(null)}>
          <label style={labelStyle}>Niveau</label>
          <select style={inputStyle} value={emotionForm.level} onChange={e => setEmotionForm(f => ({ ...f, level: Number(e.target.value), parentId: '' }))}>
            <option value={1}>Niveau 1 — Émotion principale</option>
            <option value={2}>Niveau 2 — Sous-émotion</option>
          </select>
          {emotionForm.level === 2 && (
            <>
              <label style={labelStyle}>Émotion parente *</label>
              <select style={inputStyle} value={emotionForm.parentId} onChange={e => setEmotionForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">-- Choisir une émotion principale --</option>
                {emotions.filter(e => e.level === 1).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </>
          )}
          <label style={labelStyle}>Libellé *</label>
          <input style={inputStyle} value={emotionForm.label} onChange={e => setEmotionForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Joie, Tristesse…" />
          <label style={labelStyle}>Couleur *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <input type="color" value={emotionForm.color} onChange={e => setEmotionForm(f => ({ ...f, color: e.target.value }))} style={{ width: '48px', height: '40px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{emotionForm.color}</span>
          </div>
          {emotionForm.level === 1 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Sous-émotions (niveau 2)</label>
                <button onClick={addSubEmotion} style={{ padding: '4px 12px', borderRadius: '6px', background: 'var(--green-pale)', color: 'var(--green)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>+ Ajouter</button>
              </div>
              {subEmotions.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', fontStyle: 'italic' }}>Aucune sous-émotion. Cliquez sur "+ Ajouter" pour en créer.</p>}
              {subEmotions.map((sub, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'var(--bg)', borderRadius: '8px', padding: '8px 10px', border: '1px solid var(--border)' }}>
                  <input style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.88rem', fontFamily: 'inherit' }} value={sub.label} onChange={e => updateSubEmotion(i, 'label', e.target.value)} placeholder={`Sous-émotion ${i + 1}`} />
                  <input type="color" value={sub.color} onChange={e => updateSubEmotion(i, 'color', e.target.value)} style={{ width: '36px', height: '34px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                  <button onClick={() => removeSubEmotion(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: '0 4px' }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button onClick={() => setEmotionModal(null)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Annuler</button>
            <button onClick={handleSubmitEmotion} disabled={emotionLoading} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--green)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: emotionLoading ? 0.7 : 1 }}>
              {emotionLoading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal Profil utilisateur */}
      {userProfile !== null && (
        <Modal title="Profil utilisateur" onClose={() => setUserProfile(null)} maxWidth="420px">
          {userProfileLoading || !userProfile.id ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Chargement…</div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)', margin: '0 auto 12px', border: '3px solid var(--green-light)' }}>
                  {`${userProfile.userInfo?.firstName?.[0] ?? ''}${userProfile.userInfo?.lastName?.[0] ?? ''}`.toUpperCase() || userProfile.email[0].toUpperCase()}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem' }}>
                  {userProfile.userInfo?.firstName} {userProfile.userInfo?.lastName}
                </div>
                <div style={{ marginTop: '6px' }}>{roleBadge(userProfile.role)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Email', value: userProfile.email },
                  { label: 'Ville', value: userProfile.userInfo?.city || '—' },
                  { label: 'Inscrit le', value: new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'Entrées dans le tracker', value: `${userProfile._count?.trackerEntries ?? 0} entrée(s)` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { pagesApi } from '../api/services';
import { PageInfo } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  PREVENTION: 'Prévention',
  EXERCISE: 'Exercices',
  INFORMATION: 'Information',
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  PREVENTION: { bg: '#D8F3DC', color: '#2D6A4F' },
  EXERCISE: { bg: '#FEF0E7', color: '#E76F51' },
  INFORMATION: { bg: '#EEF4FF', color: '#4A90D9' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  PREVENTION: '🧠',
  EXERCISE: '💨',
  INFORMATION: '📖',
};

export default function InformationsPage() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PageInfo | null>(null);

  useEffect(() => {
    pagesApi.getPublished()
      .then(setPages)
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pages.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (selected) {
    return (
      <div className="container page-enter">
        <button onClick={() => setSelected(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', marginBottom: '24px' }}>
          ← Retour aux ressources
        </button>
        <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '40px', maxWidth: '720px' }}>
          <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px', marginBottom: '16px', background: CATEGORY_COLORS[selected.category]?.bg, color: CATEGORY_COLORS[selected.category]?.color }}>
            {CATEGORY_LABELS[selected.category]}
          </span>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', marginBottom: '16px' }}>{selected.title}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Publié le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}
          </p>
          <div style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: '1rem' }}>{selected.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem' }}>Ressources de prévention</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Découvrez nos contenus et exercices pour mieux comprendre et gérer votre stress.</p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '10px 16px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input type="text" placeholder="Rechercher une ressource…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', background: 'transparent', color: 'var(--text)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Toutes' }, { key: 'PREVENTION', label: 'Prévention' }, { key: 'EXERCISE', label: 'Exercices' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveCategory(tab.key)}
            style={{ padding: '8px 20px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: activeCategory === tab.key ? 'var(--green)' : 'var(--border)', background: activeCategory === tab.key ? 'var(--green)' : 'white', color: activeCategory === tab.key ? 'white' : 'var(--text-muted)', transition: 'var(--transition)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{filtered.length} ressource{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filtered.map(page => (
              <div key={page.id} onClick={() => setSelected(page)}
                style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)', e.currentTarget.style.boxShadow = 'var(--shadow)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '')}>
                <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: page.category === 'PREVENTION' ? 'linear-gradient(135deg,#D8F3DC,#B7E4C7)' : 'linear-gradient(135deg,#FEF0E7,#FDDCB4)' }}>
                  {CATEGORY_EMOJI[page.category]}
                </div>
                <div style={{ padding: '20px' }}>
                  <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px', marginBottom: '10px', background: CATEGORY_COLORS[page.category]?.bg, color: CATEGORY_COLORS[page.category]?.color }}>
                    {CATEGORY_LABELS[page.category]}
                  </span>
                  <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{page.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {page.content.substring(0, 120)}…
                  </p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600, marginTop: '12px', display: 'inline-block' }}>Lire la suite →</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

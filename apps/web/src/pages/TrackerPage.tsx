import { useState, useEffect } from 'react';
import { trackerApi, emotionsApi } from '../api/services';
import { TrackerEntry, TrackerReport, Emotion } from '../types';

function groupByDay(entries: TrackerEntry[]) {
  const groups: Record<string, TrackerEntry[]> = {};
  entries.forEach(e => {
    const day = new Date(e.loggedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });
  return groups;
}

function IntensityDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < value ? 'var(--green-light)' : 'var(--border)' }} />
      ))}
    </div>
  );
}

type ChartDay = { date: string; count: number; avgIntensity: number };

function Chart30Days({ data }: { data: ChartDay[] }) {
  const [tooltip, setTooltip] = useState<{ i: number; x: number; y: number } | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const W = 760, H = 140, PAD = 16;
  const step = (W - PAD * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: PAD + i * step,
    y: H - PAD - ((d.count / maxCount) * (H - PAD * 2)),
    ...d,
  }));

  const pathD = points.reduce((acc, p, i) =>
    i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`, '');

  const areaD = `${pathD} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`;

  const fmt = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '320px' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => {
          const y = H - PAD - v * (H - PAD * 2);
          return (
            <g key={v}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD - 4} y={y + 4} fontSize="9" fill="var(--text-muted)" textAnchor="end">
                {Math.round(v * maxCount)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="var(--green)" fillOpacity="0.1" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}
            onMouseEnter={e => setTooltip({ i, x: p.x, y: p.y })}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="var(--green)" strokeWidth="2.5" />
            {/* X labels every 5 days */}
            {i % 5 === 0 && (
              <text x={p.x} y={H - 2} fontSize="8" fill="var(--text-muted)" textAnchor="middle">
                {fmt(p.date)}
              </text>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {tooltip !== null && (() => {
          const p = points[tooltip.i];
          const tx = Math.min(p.x, W - 90);
          return (
            <g>
              <rect x={tx} y={p.y - 38} width="88" height="32" rx="6" fill="var(--green)" />
              <text x={tx + 44} y={p.y - 24} fontSize="10" fill="white" textAnchor="middle" fontWeight="700">
                {fmt(p.date)}
              </text>
              <text x={tx + 44} y={p.y - 12} fontSize="9" fill="white" textAnchor="middle">
                {p.count} entrée{p.count !== 1 ? 's' : ''}{p.count > 0 ? ` · moy. ${p.avgIntensity}` : ''}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export default function TrackerPage() {
  const [tab, setTab] = useState<'journal' | 'reports'>('journal');
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [report, setReport] = useState<TrackerReport | null>(null);
  const [chart, setChart] = useState<ChartDay[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedEmotionId, setSelectedEmotionId] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      trackerApi.getHistory().then(setEntries),
      trackerApi.getReport().then(setReport),
      trackerApi.getChart30Days().then(setChart),
      trackerApi.getStreak().then(r => setStreak(r.streak)),
      emotionsApi.getAllFlat().then(e => {
        const lvl1 = e.filter(em => em.level === 1);
        setEmotions(lvl1);
        if (lvl1.length) setSelectedEmotionId(lvl1[0].id);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!selectedEmotionId) return;
    setSubmitting(true);
    try {
      const entry = await trackerApi.addEntry({ emotionId: selectedEmotionId, intensity, comment: comment || undefined });
      setEntries(prev => [entry, ...prev]);
      const [newReport, newChart, newStreak] = await Promise.all([
        trackerApi.getReport(),
        trackerApi.getChart30Days(),
        trackerApi.getStreak(),
      ]);
      setReport(newReport);
      setChart(newChart);
      setStreak(newStreak.streak);
      setShowModal(false);
      setComment('');
      setIntensity(3);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await trackerApi.deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const grouped = groupByDay(entries);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>Chargement…</div>;

  return (
    <div className="container page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem' }}>Mon Tracker d'Émotions</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Suivez votre état émotionnel au quotidien</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {streak > 0 && (
            <div style={{ background: 'var(--green-pale)', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--green)', lineHeight: 1 }}>{streak} jour{streak > 1 ? 's' : ''}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>consécutifs</div>
              </div>
            </div>
          )}
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
            + Nouvelle entrée
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--green-pale)', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '28px' }}>
        {(['journal', 'reports'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'var(--transition)', background: tab === t ? 'white' : 'transparent', color: tab === t ? 'var(--green)' : 'var(--text-muted)', boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'journal' ? '📅 Historique' : '📊 Rapports'}
          </button>
        ))}
      </div>

      {/* JOURNAL */}
      {tab === 'journal' && (
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
              <p>Aucune entrée pour l'instant.<br/>Commencez à suivre vos émotions !</p>
            </div>
          ) : (
            Object.entries(grouped).map(([day, dayEntries]) => (
              <div key={day} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  {day}
                </div>
                {dayEntries.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--card)', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.emotion.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{entry.emotion.label}</div>
                      <IntensityDots value={entry.intensity} />
                      {entry.comment && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{entry.comment}</div>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.loggedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button onClick={() => handleDelete(entry.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px' }}
                      title="Supprimer">🗑️</button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div>
          {/* Stat cards + streak */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { num: streak > 0 ? `${streak}🔥` : '0', label: 'Jours consécutifs' },
              { num: report?.totalEntries ?? 0, label: 'Entrées ce mois' },
              { num: report?.dominantEmotion ?? '—', label: 'Émotion dominante' },
              { num: report?.avgIntensity ?? 0, label: 'Intensité moyenne' },
              { num: report?.activeDays ?? 0, label: 'Jours actifs' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', color: 'var(--green)' }}>{s.num}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Graphique évolution 30 jours */}
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Évolution sur 30 jours</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Nombre d'entrées par jour</div>
            {chart.every(d => d.count === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Pas assez de données.</p>
            ) : (
              <Chart30Days data={chart} />
            )}
          </div>

          {/* Répartition émotions */}
          {report && (
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontWeight: 700, marginBottom: '20px' }}>Répartition des émotions — Ce mois</div>
              {Object.keys(report.emotionCount).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Pas assez de données.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                    {Object.entries(report.emotionCount).map(([emotion, count]) => {
                      const max = Math.max(...Object.values(report.emotionCount));
                      const height = Math.max(8, (count / max) * 100);
                      return (
                        <div key={emotion} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ width: '100%', height: `${height}%`, background: 'var(--green-light)', borderRadius: '6px 6px 0 0', transition: 'var(--transition)', minHeight: '4px' }} title={`${count} fois`} />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>{emotion}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {Object.entries(report.emotionCount).map(([emotion, count]) => (
                      <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--green-light)' }} />
                        {emotion} ({count})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', marginBottom: '4px' }}>Ajouter une émotion</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Comment vous sentez-vous en ce moment ?</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Émotion</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {emotions.map(em => (
                  <button key={em.id} onClick={() => setSelectedEmotionId(em.id)}
                    style={{ padding: '10px 8px', borderRadius: '12px', border: `2px solid ${selectedEmotionId === em.id ? em.color : 'var(--border)'}`, background: selectedEmotionId === em.id ? em.color + '22' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'var(--transition)', color: selectedEmotionId === em.id ? em.color : 'var(--text)' }}>
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Intensité : {intensity}/5</label>
              <input type="range" min="1" max="5" value={intensity} onChange={e => setIntensity(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--green)' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Commentaire (optionnel)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Décrivez ce que vous ressentez…"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', minHeight: '80px', background: 'var(--bg)', fontFamily: 'Sora, sans-serif' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                Annuler
              </button>
              <button onClick={handleAdd} disabled={submitting || !selectedEmotionId}
                style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

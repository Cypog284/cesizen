import request from 'supertest';
import app from '../app';
import { trackerRepository } from '../repositories/trackerRepository';
import jwt from 'jsonwebtoken';

jest.mock('../repositories/trackerRepository');
const mockTracker = trackerRepository as jest.Mocked<typeof trackerRepository>;

process.env.JWT_SECRET = 'test-secret-cesizen';

function makeToken(payload: object = { id: 'user-1', email: 'user@example.com', role: 'USER' }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

const AUTH = `Bearer ${makeToken()}`;

function makeEntry(overrides: Partial<any> = {}) {
  return {
    id: 'entry-1',
    userId: 'user-1',
    emotionId: 'em-1',
    intensity: 3,
    comment: null,
    loggedAt: new Date(),
    emotion: { id: 'em-1', label: 'Joie', color: '#2d6a4f', level: 2, parentId: 'em-parent' },
    ...overrides,
  };
}

// ──────────────────────────────────────────────
describe('POST /api/tracker', () => {
  it('adds an entry for authenticated user', async () => {
    mockTracker.createEntry.mockResolvedValue(makeEntry() as any);

    const res = await request(app)
      .post('/api/tracker')
      .set('Authorization', AUTH)
      .send({ emotionId: 'em-1', intensity: 3 });

    expect(res.status).toBe(201);
    expect(res.body.emotion.label).toBe('Joie');
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/tracker')
      .send({ emotionId: 'em-1', intensity: 3 });

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
describe('GET /api/tracker', () => {
  it('returns history for authenticated user', async () => {
    mockTracker.getEntriesByUser.mockResolvedValue([makeEntry(), makeEntry({ id: 'entry-2' })]);

    const res = await request(app)
      .get('/api/tracker')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/tracker');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
describe('GET /api/tracker/streak', () => {
  it('returns streak count for authenticated user', async () => {
    mockTracker.getStreak.mockResolvedValue(5);

    const res = await request(app)
      .get('/api/tracker/streak')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body.streak).toBe(5);
  });

  it('returns streak of 0 when no entries', async () => {
    mockTracker.getStreak.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/tracker/streak')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body.streak).toBe(0);
  });
});

// ──────────────────────────────────────────────
describe('GET /api/tracker/report', () => {
  it('returns monthly report for authenticated user', async () => {
    mockTracker.getStats.mockResolvedValue({
      totalEntries: 10,
      avgIntensity: 3.2,
      dominantEmotion: 'Joie',
      activeDays: 5,
      emotionCount: { Joie: 6, Tristesse: 4 },
    });

    const res = await request(app)
      .get('/api/tracker/report')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body.totalEntries).toBe(10);
    expect(res.body.dominantEmotion).toBe('Joie');
  });
});

// ──────────────────────────────────────────────
describe('GET /api/tracker/chart', () => {
  it('returns 30-day chart data for authenticated user', async () => {
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      count: i % 3,
      avgIntensity: i % 3 > 0 ? 3.0 : 0,
    }));
    mockTracker.getChart30Days.mockResolvedValue(chartData);

    const res = await request(app)
      .get('/api/tracker/chart')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(30);
  });
});

// ──────────────────────────────────────────────
describe('DELETE /api/tracker/:id', () => {
  it('deletes an entry', async () => {
    mockTracker.deleteEntry.mockResolvedValue(makeEntry() as any);

    const res = await request(app)
      .delete('/api/tracker/entry-1')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).delete('/api/tracker/entry-1');
    expect(res.status).toBe(401);
  });
});

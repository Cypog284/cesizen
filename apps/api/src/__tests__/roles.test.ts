import request from 'supertest';
import app from '../app';
import { userRepository } from '../repositories/cesizentRepository';
import jwt from 'jsonwebtoken';

jest.mock('../repositories/cesizentRepository');
const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

process.env.JWT_SECRET = 'test-secret-cesizen';

function makeToken(id: string, role: string) {
  return jwt.sign({ id, email: `${role}@example.com`, role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

const USER_TOKEN = makeToken('user-1', 'USER');
const ADMIN_TOKEN = makeToken('admin-1', 'ADMIN');
const SUPER_TOKEN = makeToken('super-1', 'SUPER_ADMIN');

function makeUser(id: string, role: string) {
  return {
    id,
    email: `${id}@example.com`,
    role,
    createdAt: new Date(),
    deletedAt: null,
    userInfo: { firstName: 'Test', lastName: 'User', city: null },
    _count: { trackerEntries: 0 },
  };
}

// ──────────────────────────────────────────────
describe('GET /api/users — admin-only route', () => {
  it('allows ADMIN access', async () => {
    mockUserRepo.getAll.mockResolvedValue([makeUser('user-1', 'USER') as any]);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
  });

  it('allows SUPER_ADMIN access', async () => {
    mockUserRepo.getAll.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${SUPER_TOKEN}`);

    expect(res.status).toBe(200);
  });

  it('blocks USER access with 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${USER_TOKEN}`);

    expect(res.status).toBe(403);
  });

  it('blocks unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
describe('PUT /api/users/:id/role — role change protections', () => {
  it('allows ADMIN to promote USER to ADMIN', async () => {
    const targetUser = makeUser('user-2', 'USER');
    mockUserRepo.getById.mockResolvedValue(targetUser as any);
    mockUserRepo.updateRole.mockResolvedValue({ ...targetUser, role: 'ADMIN' } as any);

    const res = await request(app)
      .put('/api/users/user-2/role')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
  });

  it('blocks ADMIN from touching a SUPER_ADMIN', async () => {
    const targetUser = makeUser('super-2', 'SUPER_ADMIN');
    mockUserRepo.getById.mockResolvedValue(targetUser as any);

    const res = await request(app)
      .put('/api/users/super-2/role')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'USER' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/super/i);
  });

  it('blocks ADMIN from assigning SUPER_ADMIN role', async () => {
    const targetUser = makeUser('user-3', 'USER');
    mockUserRepo.getById.mockResolvedValue(targetUser as any);

    const res = await request(app)
      .put('/api/users/user-3/role')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'SUPER_ADMIN' });

    expect(res.status).toBe(403);
  });

  it('blocks ADMIN from changing their own role', async () => {
    const targetUser = makeUser('admin-1', 'ADMIN');
    mockUserRepo.getById.mockResolvedValue(targetUser as any);

    const res = await request(app)
      .put('/api/users/admin-1/role')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'USER' });

    expect(res.status).toBe(403);
  });

  it('blocks SUPER_ADMIN from removing their own SUPER_ADMIN role', async () => {
    // The first guard catches self-modification regardless of role
    const res = await request(app)
      .put('/api/users/super-1/role')
      .set('Authorization', `Bearer ${SUPER_TOKEN}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/propre/i);
  });

  it('allows SUPER_ADMIN to promote USER to ADMIN', async () => {
    const targetUser = makeUser('user-4', 'USER');
    mockUserRepo.getById.mockResolvedValue(targetUser as any);
    mockUserRepo.updateRole.mockResolvedValue({ ...targetUser, role: 'ADMIN' } as any);

    const res = await request(app)
      .put('/api/users/user-4/role')
      .set('Authorization', `Bearer ${SUPER_TOKEN}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
  });

  it('blocks USER from changing any role', async () => {
    const res = await request(app)
      .put('/api/users/user-2/role')
      .set('Authorization', `Bearer ${USER_TOKEN}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────
describe('GET /api/users/:id — user profile for admin', () => {
  it('returns user profile for ADMIN', async () => {
    mockUserRepo.getById.mockResolvedValue(makeUser('user-1', 'USER') as any);

    const res = await request(app)
      .get('/api/users/user-1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('user-1');
  });

  it('returns 404 for non-existent user', async () => {
    mockUserRepo.getById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/ghost-id')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
  });
});

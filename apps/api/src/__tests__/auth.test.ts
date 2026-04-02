import request from 'supertest';
import app from '../app';
import { authRepository } from '../repositories/authRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Mocks
jest.mock('../repositories/authRepository');
const mockRepo = authRepository as jest.Mocked<typeof authRepository>;

process.env.JWT_SECRET = 'test-secret-cesizen';

// ── Helpers
function makeUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    role: 'USER',
    passwordHash: bcrypt.hashSync('password123', 4),
    createdAt: new Date(),
    deletedAt: null,
    userInfo: { firstName: 'Jean', lastName: 'Dupont', city: 'Paris' },
    ...overrides,
  };
}

function makeToken(payload: object = { id: 'user-1', email: 'test@example.com', role: 'USER' }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

// ──────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a new user and returns a token', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.createUser.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 400 when email already exists', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/déjà utilisé/);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for wrong password', async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect/);
  });

  it('returns 401 when user not found', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns user info with valid token', async () => {
    mockRepo.findById.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
describe('PUT /api/auth/me/password', () => {
  it('changes password with correct current password', async () => {
    mockRepo.findById.mockResolvedValue(makeUser() as any);
    mockRepo.updatePassword.mockResolvedValue(undefined as any);

    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/mis à jour/);
  });

  it('returns 400 with wrong current password', async () => {
    mockRepo.findById.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/incorrect/);
  });

  it('returns 400 when new password is too short', async () => {
    mockRepo.findById.mockResolvedValue(makeUser() as any);

    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .put('/api/auth/me/password')
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(res.status).toBe(401);
  });
});

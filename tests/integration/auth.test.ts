import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { generateToken } from '../../src/config/jwt';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Mock bcrypt
jest.mock('bcryptjs');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                id: 1,
                email: 'newuser@example.com',
                name: 'New User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.create.mockResolvedValue(newUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123',
                    name: 'New User',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'short',
                    name: 'Test User',
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should reject registration without name', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);
            mockBcrypt.compare = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.token).toBeDefined();
        });

        it('should reject login with invalid email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
        });

        it('should reject login with wrong password', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);
            mockBcrypt.compare = jest.fn().mockResolvedValue(false);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
        });

        it.skip('should reject login for inactive user', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: false,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get current user with valid token', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);

            const token = generateToken({
                userId: 1,
                email: 'test@example.com',
                role: UserRole.AUTHOR,
            });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/auth/me', () => {
        it('should update user profile', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedUser = {
                ...user,
                name: 'Updated Name',
                bio: 'Updated bio',
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const token = generateToken({
                userId: 1,
                email: 'test@example.com',
                role: UserRole.AUTHOR,
            });

            const response = await request(app)
                .put('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Name',
                    bio: 'Updated bio',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject invalid profile data', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);

            const token = generateToken({
                userId: 1,
                email: 'test@example.com',
                role: UserRole.AUTHOR,
            });

            const response = await request(app)
                .put('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    bio: 'a'.repeat(501), // Too long
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(user);

            const token = generateToken({
                userId: 1,
                email: 'test@example.com',
                role: UserRole.AUTHOR,
            });

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});

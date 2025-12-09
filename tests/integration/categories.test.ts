import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { generateToken } from '../../src/config/jwt';
import { UserRole } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        category: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        article: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Categories Integration Tests', () => {
    const adminToken = generateToken({
        userId: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
    });

    const authorToken = generateToken({
        userId: 2,
        email: 'author@example.com',
        role: UserRole.AUTHOR,
    });

    const mockCategory = {
        id: 1,
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
            articles: 0,
            children: 0,
        },
    };

    const mockAdminUser = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        avatarUrl: null,
        bio: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/categories', () => {
        it('should get all categories', async () => {
            mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

            const response = await request(app)
                .get('/api/categories');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('GET /api/categories/tree', () => {
        it('should get category tree', async () => {
            mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

            const response = await request(app)
                .get('/api/categories/tree');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/categories/:slug', () => {
        it('should get category by slug', async () => {
            mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

            const response = await request(app)
                .get('/api/categories/technology');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.slug).toBe('technology');
        });

        it('should return 404 for non-existent category', async () => {
            mockPrisma.category.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/categories/non-existent');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/categories', () => {
        it('should create category as admin', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
            mockPrisma.category.findUnique.mockResolvedValue(null); // No existing slug
            mockPrisma.category.create.mockResolvedValue(mockCategory);

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Technology',
                    description: 'Tech articles',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should reject category creation by non-admin', async () => {
            const authorUser = {
                ...mockAdminUser,
                id: 2,
                role: UserRole.AUTHOR,
            };

            mockPrisma.user.findUnique.mockResolvedValue(authorUser);

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    name: 'Technology',
                });

            expect(response.status).toBe(403);
        });

        it('should reject category creation without authentication', async () => {
            const response = await request(app)
                .post('/api/categories')
                .send({
                    name: 'Technology',
                });

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/categories/:id', () => {
        it('should update category as admin', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
            mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
            mockPrisma.category.update.mockResolvedValue({
                ...mockCategory,
                name: 'Updated Tech',
            });

            const response = await request(app)
                .put('/api/categories/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Tech',
                });

            expect(response.status).toBe(200);
        });

        it('should reject update by non-admin', async () => {
            const authorUser = {
                ...mockAdminUser,
                id: 2,
                role: UserRole.AUTHOR,
            };

            mockPrisma.user.findUnique.mockResolvedValue(authorUser);

            const response = await request(app)
                .put('/api/categories/1')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    name: 'Updated Tech',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        it('should delete category as admin', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
            mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
            mockPrisma.category.delete.mockResolvedValue(mockCategory);

            const response = await request(app)
                .delete('/api/categories/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it('should reject delete by non-admin', async () => {
            const authorUser = {
                ...mockAdminUser,
                id: 2,
                role: UserRole.AUTHOR,
            };

            mockPrisma.user.findUnique.mockResolvedValue(authorUser);

            const response = await request(app)
                .delete('/api/categories/1')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent category', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
            mockPrisma.category.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/categories/999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });
});

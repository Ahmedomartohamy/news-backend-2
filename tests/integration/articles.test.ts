import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { generateToken } from '../../src/config/jwt';
import { UserRole, ArticleStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        article: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        category: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Articles Integration Tests', () => {
    const authorToken = generateToken({
        userId: 1,
        email: 'author@example.com',
        role: UserRole.AUTHOR,
    });

    const adminToken = generateToken({
        userId: 2,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
    });

    const mockUser = {
        id: 1,
        email: 'author@example.com',
        name: 'Author',
        role: UserRole.AUTHOR,
        isActive: true,
        avatarUrl: null,
        bio: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockArticle = {
        id: 1,
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        featuredImage: null,
        authorId: 1,
        categoryId: 1,
        status: ArticleStatus.DRAFT,
        viewCount: 0,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
            id: 1,
            name: 'Author',
            email: 'author@example.com',
            avatarUrl: null,
        },
        category: {
            id: 1,
            name: 'Tech',
            slug: 'tech',
            description: null,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        tags: [],
        _count: { comments: 0 },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/articles', () => {
        it('should get all published articles for unauthenticated users', async () => {
            mockPrisma.article.findMany.mockResolvedValue([mockArticle]);
            mockPrisma.article.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/articles');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should support pagination', async () => {
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            const response = await request(app)
                .get('/api/articles?page=2&limit=20');

            expect(response.status).toBe(200);
            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 20,
                })
            );
        });

        it('should support filtering by status', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            const response = await request(app)
                .get('/api/articles?status=DRAFT')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/articles/:slug', () => {
        it('should get article by slug', async () => {
            const publishedArticle = {
                ...mockArticle,
                status: ArticleStatus.PUBLISHED,
            };
            mockPrisma.article.findUnique.mockResolvedValue(publishedArticle);

            const response = await request(app)
                .get('/api/articles/test-article');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 404 for non-existent article', async () => {
            mockPrisma.article.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/articles/non-existent');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/articles', () => {
        it('should create article with valid data', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.category.findUnique.mockResolvedValue({
                id: 1,
                name: 'Tech',
                slug: 'tech',
                description: null,
                parentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockPrisma.article.findUnique.mockResolvedValue(null); // No existing slug
            mockPrisma.article.create.mockResolvedValue(mockArticle);

            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    title: 'New Article',
                    content: 'Article content',
                    categoryId: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should reject article creation without authentication', async () => {
            const response = await request(app)
                .post('/api/articles')
                .send({
                    title: 'New Article',
                    content: 'Article content',
                    categoryId: 1,
                });

            expect(response.status).toBe(401);
        });

        it('should reject article with missing required fields', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    title: 'New Article',
                    // Missing content and categoryId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/articles/:id', () => {
        it('should update own article', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticle,
                title: 'Updated Title',
            });

            const response = await request(app)
                .put('/api/articles/1')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    title: 'Updated Title',
                });

            expect(response.status).toBe(200);
        });

        it('should reject updating another user\'s article', async () => {
            const otherUserArticle = {
                ...mockArticle,
                authorId: 999,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findUnique.mockResolvedValue(otherUserArticle);

            const response = await request(app)
                .put('/api/articles/1')
                .set('Authorization', `Bearer ${authorToken}`)
                .send({
                    title: 'Updated Title',
                });

            expect(response.status).toBe(403);
        });

        it('should allow admin to update any article', async () => {
            const adminUser = {
                ...mockUser,
                id: 2,
                role: UserRole.ADMIN,
            };

            mockPrisma.user.findUnique.mockResolvedValue(adminUser);
            mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticle,
                title: 'Admin Updated',
            });

            const response = await request(app)
                .put('/api/articles/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Admin Updated',
                });

            expect(response.status).toBe(200);
        });
    });

    describe('DELETE /api/articles/:id', () => {
        it('should delete own article', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
            mockPrisma.article.delete.mockResolvedValue(mockArticle);

            const response = await request(app)
                .delete('/api/articles/1')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(200);
        });

        it('should reject deleting another user\'s article', async () => {
            const otherUserArticle = {
                ...mockArticle,
                authorId: 999,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findUnique.mockResolvedValue(otherUserArticle);

            const response = await request(app)
                .delete('/api/articles/1')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent article', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/articles/999')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/articles/:id/publish', () => {
        it('should publish article', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticle,
                status: ArticleStatus.PUBLISHED,
                publishedAt: new Date(),
            });

            const response = await request(app)
                .patch('/api/articles/1/publish')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(200);
        });

        it('should require authentication to publish', async () => {
            const response = await request(app)
                .patch('/api/articles/1/publish');

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /api/articles/:id/archive', () => {
        it('should archive article', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.article.update.mockResolvedValue({
                ...mockArticle,
                status: ArticleStatus.ARCHIVED,
            });

            const response = await request(app)
                .patch('/api/articles/1/archive')
                .set('Authorization', `Bearer ${authorToken}`);

            expect(response.status).toBe(200);
        });
    });
});

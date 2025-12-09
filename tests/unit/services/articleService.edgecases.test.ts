import articleService from '../../../src/services/articleService';
import prisma from '../../../src/config/prisma';
import { ArticleStatus } from '@prisma/client';
import { mockArticle, mockCategory } from '../../helpers/prisma.mock';

// Mock dependencies
jest.mock('../../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        article: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        category: {
            findUnique: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as any;

describe('Article Service - Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createArticle', () => {
        it('should create article without category', async () => {
            const articleData = {
                title: 'Test Article',
                content: 'Content',
                excerpt: 'Excerpt',
            };

            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue(mockArticle());

            const result = await articleService.createArticle(articleData, 1);

            expect(result).toBeDefined();
            expect(mockPrisma.category.findUnique).not.toHaveBeenCalled();
        });

        it('should create article with tags', async () => {
            const articleData = {
                title: 'Test Article',
                content: 'Content',
                excerpt: 'Excerpt',
                tagIds: [1, 2, 3],
            };

            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue(mockArticle());

            await articleService.createArticle(articleData, 1);

            expect(mockPrisma.article.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tags: expect.objectContaining({
                            connect: expect.arrayContaining([{ id: 1 }, { id: 2 }, { id: 3 }]),
                        }),
                    }),
                })
            );
        });

        it('should create article with PUBLISHED status and set publishedAt', async () => {
            const articleData = {
                title: 'Published Article',
                content: 'Content',
                excerpt: 'Excerpt',
                status: ArticleStatus.PUBLISHED,
            };

            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue(mockArticle({ status: ArticleStatus.PUBLISHED }));

            await articleService.createArticle(articleData, 1);

            expect(mockPrisma.article.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: ArticleStatus.PUBLISHED,
                        publishedAt: expect.any(Date),
                    }),
                })
            );
        });

        it('should create article with DRAFT status and null publishedAt', async () => {
            const articleData = {
                title: 'Draft Article',
                content: 'Content',
                excerpt: 'Excerpt',
            };

            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue(mockArticle());

            await articleService.createArticle(articleData, 1);

            expect(mockPrisma.article.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: ArticleStatus.DRAFT,
                        publishedAt: null,
                    }),
                })
            );
        });
    });

    describe('getArticleBySlug', () => {
        it('should increment view count for published articles', async () => {
            const article = mockArticle({ status: ArticleStatus.PUBLISHED });
            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.update.mockResolvedValue(article);

            await articleService.getArticleBySlug('test-slug', true);

            expect(mockPrisma.article.update).toHaveBeenCalledWith({
                where: { id: article.id },
                data: { viewCount: { increment: 1 } },
            });
        });

        it('should not increment view count for draft articles', async () => {
            const article = mockArticle({ status: ArticleStatus.DRAFT });
            mockPrisma.article.findUnique.mockResolvedValue(article);

            await articleService.getArticleBySlug('test-slug', true);

            expect(mockPrisma.article.update).not.toHaveBeenCalled();
        });

        it('should not increment view count when incrementView is false', async () => {
            const article = mockArticle({ status: ArticleStatus.PUBLISHED });
            mockPrisma.article.findUnique.mockResolvedValue(article);

            await articleService.getArticleBySlug('test-slug', false);

            expect(mockPrisma.article.update).not.toHaveBeenCalled();
        });
    });

    describe('getAllArticles', () => {
        it('should filter by tagId', async () => {
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            await articleService.getAllArticles({ tagId: 1 }, { page: 1, limit: 10 });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tags: { some: { id: 1 } },
                    }),
                })
            );
        });

        it('should filter by search query', async () => {
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            await articleService.getAllArticles({ search: 'test' }, { page: 1, limit: 10 });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ title: expect.anything() }),
                            expect.objectContaining({ content: expect.anything() }),
                            expect.objectContaining({ excerpt: expect.anything() }),
                        ]),
                    }),
                })
            );
        });

        it('should use custom sort and order', async () => {
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            await articleService.getAllArticles({}, { page: 1, limit: 10, sort: 'title', order: 'asc' });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { title: 'asc' },
                })
            );
        });

        it('should use default sort by createdAt desc', async () => {
            mockPrisma.article.findMany.mockResolvedValue([]);
            mockPrisma.article.count.mockResolvedValue(0);

            await articleService.getAllArticles({}, { page: 1, limit: 10 });

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                })
            );
        });
    });

    describe('updateArticle', () => {
        it('should not regenerate slug if title unchanged', async () => {
            const article = mockArticle({ title: 'Same Title' });
            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.update.mockResolvedValue(article);

            await articleService.updateArticle(1, { title: 'Same Title' }, 1, 'AUTHOR');

            expect(mockPrisma.article.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        slug: article.slug,
                    }),
                })
            );
        });

        it('should set publishedAt when changing to PUBLISHED status', async () => {
            const article = mockArticle({ status: ArticleStatus.DRAFT, publishedAt: null });
            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.update.mockResolvedValue({ ...article, status: ArticleStatus.PUBLISHED });

            await articleService.updateArticle(1, { status: ArticleStatus.PUBLISHED }, 1, 'AUTHOR');

            expect(mockPrisma.article.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        publishedAt: expect.any(Date),
                    }),
                })
            );
        });

        it('should not change publishedAt if already published', async () => {
            const publishedAt = new Date('2024-01-01');
            const article = mockArticle({ status: ArticleStatus.PUBLISHED, publishedAt });
            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.update.mockResolvedValue(article);

            await articleService.updateArticle(1, { content: 'Updated' }, 1, 'AUTHOR');

            expect(mockPrisma.article.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        publishedAt,
                    }),
                })
            );
        });

        it('should update tags when tagIds provided', async () => {
            const article = mockArticle();
            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.update.mockResolvedValue(article);

            await articleService.updateArticle(1, { tagIds: [1, 2] }, 1, 'AUTHOR');

            expect(mockPrisma.article.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tags: expect.objectContaining({
                            set: [{ id: 1 }, { id: 2 }],
                        }),
                    }),
                })
            );
        });
    });

    describe('getRelatedArticles', () => {
        it('should find articles by category and tags', async () => {
            const article = mockArticle({
                categoryId: 1,
                tags: [{ id: 1, name: 'Tag1', slug: 'tag1', createdAt: new Date(), updatedAt: new Date() }],
            });

            mockPrisma.article.findUnique.mockResolvedValue(article);
            mockPrisma.article.findMany.mockResolvedValue([]);

            await articleService.getRelatedArticles(1, 5);

            expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { not: 1 },
                        status: ArticleStatus.PUBLISHED,
                        OR: expect.arrayContaining([
                            { categoryId: 1 },
                            expect.objectContaining({
                                tags: expect.anything(),
                            }),
                        ]),
                    }),
                    take: 5,
                })
            );
        });
    });
});

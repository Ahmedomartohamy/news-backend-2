import tagService from '../../../src/services/tagService';
import prisma from '../../../src/config/prisma';
import { mockTag } from '../../helpers/prisma.mock';

// Mock dependencies
jest.mock('../../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        tag: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            upsert: jest.fn(),
        },
        article: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as any;

describe('Tag Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTag', () => {
        it('should create tag successfully', async () => {
            const tagData = { name: 'JavaScript' };

            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue(mockTag({ name: 'JavaScript', slug: 'javascript' }));

            const result = await tagService.createTag(tagData);

            expect(result.name).toBe('JavaScript');
            expect(mockPrisma.tag.create).toHaveBeenCalled();
        });
    });

    describe('getAllTags', () => {
        it('should get all tags', async () => {
            const tags = [mockTag(), mockTag({ id: 2, name: 'TypeScript' })];
            mockPrisma.tag.findMany.mockResolvedValue(tags);

            const result = await tagService.getAllTags();

            expect(result).toEqual(tags);
            expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { name: 'asc' },
                })
            );
        });
    });

    describe('getTagBySlug', () => {
        it('should get tag by slug', async () => {
            const tag = mockTag({ slug: 'javascript' });
            mockPrisma.tag.findUnique.mockResolvedValue(tag);

            const result = await tagService.getTagBySlug('javascript');

            expect(result).toEqual(tag);
        });

        it('should throw error if tag not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);

            await expect(tagService.getTagBySlug('nonexistent')).rejects.toThrow('Tag not found');
        });
    });

    describe('getTagById', () => {
        it('should get tag by id', async () => {
            const tag = mockTag();
            mockPrisma.tag.findUnique.mockResolvedValue(tag);

            const result = await tagService.getTagById(1);

            expect(result).toEqual(tag);
        });

        it('should throw error if tag not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);

            await expect(tagService.getTagById(999)).rejects.toThrow('Tag not found');
        });
    });

    describe('getPopularTags', () => {
        it('should get popular tags with default limit', async () => {
            const tags = [mockTag(), mockTag({ id: 2 })];
            mockPrisma.tag.findMany.mockResolvedValue(tags);

            const result = await tagService.getPopularTags();

            expect(result).toEqual(tags);
            expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                })
            );
        });

        it('should get popular tags with custom limit', async () => {
            const tags = [mockTag()];
            mockPrisma.tag.findMany.mockResolvedValue(tags);

            await tagService.getPopularTags(5);

            expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5,
                })
            );
        });
    });

    describe('updateTag', () => {
        it('should update tag successfully', async () => {
            const existingTag = mockTag();
            const updatedTag = { ...existingTag, name: 'Updated Tag' };

            mockPrisma.tag.findUnique
                .mockResolvedValueOnce(existingTag)
                .mockResolvedValueOnce(null);
            mockPrisma.tag.update.mockResolvedValue(updatedTag);

            const result = await tagService.updateTag(1, { name: 'Updated Tag' });

            expect(result.name).toBe('Updated Tag');
        });

        it('should throw error if tag not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);

            await expect(tagService.updateTag(999, { name: 'Updated' })).rejects.toThrow('Tag not found');
        });
    });

    describe('deleteTag', () => {
        it('should delete tag successfully', async () => {
            const tag = mockTag();
            mockPrisma.tag.findUnique.mockResolvedValue({ ...tag, _count: { articles: 0 } });
            mockPrisma.tag.delete.mockResolvedValue(tag);

            const result = await tagService.deleteTag(1);

            expect(result.message).toBe('Tag deleted successfully');
            expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should throw error if tag is used in articles', async () => {
            const tag = mockTag();
            mockPrisma.tag.findUnique.mockResolvedValue({ ...tag, _count: { articles: 5 } });

            await expect(tagService.deleteTag(1)).rejects.toThrow('Cannot delete tag used in 5 articles');
        });

        it('should throw error if tag not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);

            await expect(tagService.deleteTag(999)).rejects.toThrow('Tag not found');
        });
    });

    describe('getArticlesByTag', () => {
        it('should get articles by tag', async () => {
            const tag = mockTag({ slug: 'javascript' });
            const articles = [{ id: 1, title: 'Article 1' }];

            mockPrisma.tag.findUnique.mockResolvedValue(tag);
            mockPrisma.article.findMany.mockResolvedValue(articles);
            mockPrisma.article.count.mockResolvedValue(1);

            const result = await tagService.getArticlesByTag('javascript', 1, 10);

            expect(result.tag).toEqual(tag);
            expect(result.articles).toEqual(articles);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });

        it('should throw error if tag not found', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);

            await expect(tagService.getArticlesByTag('nonexistent')).rejects.toThrow('Tag not found');
        });
    });

    describe('getOrCreateTags', () => {
        it('should get or create tags', async () => {
            const tagNames = ['JavaScript', 'TypeScript'];
            const tags = [
                mockTag({ name: 'JavaScript', slug: 'javascript' }),
                mockTag({ id: 2, name: 'TypeScript', slug: 'typescript' }),
            ];

            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.upsert
                .mockResolvedValueOnce(tags[0])
                .mockResolvedValueOnce(tags[1]);

            const result = await tagService.getOrCreateTags(tagNames);

            expect(result).toHaveLength(2);
            expect(mockPrisma.tag.upsert).toHaveBeenCalledTimes(2);
        });
    });
});

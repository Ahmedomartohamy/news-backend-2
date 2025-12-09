import { Request, Response } from 'express';
import * as tagController from '../../../src/controllers/tagController';
import tagService from '../../../src/services/tagService';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';

// Mock dependencies
jest.mock('../../../src/services/tagService');

const mockTagService = tagService as jest.Mocked<typeof tagService>;

describe('Tag Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('getAllTags', () => {
        it('should get all tags', async () => {
            const tags = [
                { id: 1, name: 'JavaScript', slug: 'javascript' },
                { id: 2, name: 'TypeScript', slug: 'typescript' },
            ];

            mockTagService.getAllTags.mockResolvedValue(tags as any);

            await tagController.getAllTags(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: tags,
            });
        });
    });

    describe('getPopularTags', () => {
        it('should get popular tags', async () => {
            const tags = [{ id: 1, name: 'JavaScript', slug: 'javascript' }];
            req.query = { limit: '5' };

            mockTagService.getPopularTags.mockResolvedValue(tags as any);

            await tagController.getPopularTags(req as Request, res as Response, next);

            expect(mockTagService.getPopularTags).toHaveBeenCalledWith(5);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: tags,
            });
        });
    });

    describe('getTagBySlug', () => {
        it('should get tag by slug', async () => {
            const tag = { id: 1, name: 'JavaScript', slug: 'javascript' };
            req.params = { slug: 'javascript' };

            mockTagService.getTagBySlug.mockResolvedValue(tag as any);

            await tagController.getTagBySlug(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: tag,
            });
        });

        it('should throw error if slug is missing', async () => {
            req.params = {};

            await tagController.getTagBySlug(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getArticlesByTag', () => {
        it('should get articles by tag', async () => {
            const result = {
                tag: { id: 1, name: 'JavaScript' },
                articles: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            };

            req.params = { slug: 'javascript' };
            req.query = { page: '1', limit: '10' };

            mockTagService.getArticlesByTag.mockResolvedValue(result as any);

            await tagController.getArticlesByTag(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: result,
            });
        });
    });

    describe('createTag', () => {
        it('should create tag successfully', async () => {
            const newTag = { id: 1, name: 'JavaScript', slug: 'javascript' };
            req.body = { name: 'JavaScript' };

            mockTagService.createTag.mockResolvedValue(newTag as any);

            await tagController.createTag(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: newTag,
                message: 'Tag created successfully',
            });
        });
    });

    describe('updateTag', () => {
        it('should update tag successfully', async () => {
            const updatedTag = { id: 1, name: 'Updated Tag', slug: 'updated-tag' };
            req.params = { id: '1' };
            req.body = { name: 'Updated Tag' };

            mockTagService.updateTag.mockResolvedValue(updatedTag as any);

            await tagController.updateTag(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedTag,
                message: 'Tag updated successfully',
            });
        });
    });

    describe('deleteTag', () => {
        it('should delete tag successfully', async () => {
            req.params = { id: '1' };

            mockTagService.deleteTag.mockResolvedValue({
                message: 'Tag deleted successfully',
            });

            await tagController.deleteTag(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Tag deleted successfully',
            });
        });
    });
});

import { Request, Response } from 'express';
import * as mediaController from '../../../src/controllers/mediaController';
import mediaService from '../../../src/services/mediaService';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/services/mediaService');

const mockMediaService = mediaService as jest.Mocked<typeof mediaService>;

describe('Media Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('uploadMedia', () => {
        it('should upload media successfully', async () => {
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const uploadedMedia = {
                id: 1,
                filename: 'test-123.jpg',
                originalName: 'test.jpg',
                r2Url: 'https://cdn.example.com/test-123.jpg',
                mimeType: 'image/jpeg',
                size: 1024,
            };

            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.file = mockFile;

            mockMediaService.uploadMedia.mockResolvedValue(uploadedMedia as any);

            await mediaController.uploadMedia(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: uploadedMedia,
                message: 'File uploaded successfully',
            });
        });

        it('should reject upload without authentication', async () => {
            req.user = undefined;

            await mediaController.uploadMedia(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should reject upload without file', async () => {
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.file = undefined;

            await mediaController.uploadMedia(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('uploadMultipleMedia', () => {
        it('should upload multiple files successfully', async () => {
            const mockFiles = [
                {
                    fieldname: 'files',
                    originalname: 'test1.jpg',
                    encoding: '7bit',
                    mimetype: 'image/jpeg',
                    buffer: Buffer.from('test1'),
                    size: 1024,
                } as Express.Multer.File,
                {
                    fieldname: 'files',
                    originalname: 'test2.jpg',
                    encoding: '7bit',
                    mimetype: 'image/jpeg',
                    buffer: Buffer.from('test2'),
                    size: 2048,
                } as Express.Multer.File,
            ];

            const uploadedMedia = [
                { id: 1, filename: 'test1-123.jpg' },
                { id: 2, filename: 'test2-456.jpg' },
            ];

            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.files = mockFiles;

            mockMediaService.uploadMultipleMedia.mockResolvedValue(uploadedMedia as any);

            await mediaController.uploadMultipleMedia(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: uploadedMedia,
                message: '2 files uploaded successfully',
            });
        });

        it('should reject without files', async () => {
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.files = [];

            await mediaController.uploadMultipleMedia(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getAllMedia', () => {
        it('should get all media with pagination', async () => {
            const media = [
                { id: 1, filename: 'test1.jpg' },
                { id: 2, filename: 'test2.jpg' },
            ];

            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.query = { page: '1', limit: '20' };

            mockMediaService.getAllMedia.mockResolvedValue({
                media: media as any,
                pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
            });

            await mediaController.getAllMedia(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: media,
                pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
            });
        });

        it('should reject without authentication', async () => {
            req.user = undefined;

            await mediaController.getAllMedia(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getMediaById', () => {
        it('should get media by id', async () => {
            const media = { id: 1, filename: 'test.jpg' };
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.params = { id: '1' };

            mockMediaService.getMediaById.mockResolvedValue(media as any);

            await mediaController.getMediaById(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: media,
            });
        });

        it('should reject without id', async () => {
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.params = {};

            await mediaController.getMediaById(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getMyMedia', () => {
        it('should get user media', async () => {
            const media = [{ id: 1, filename: 'my-file.jpg' }];
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.query = { page: '1', limit: '20' };

            mockMediaService.getMediaByUser.mockResolvedValue({
                media: media as any,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });

            await mediaController.getMyMedia(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: media,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });
        });
    });

    describe('searchMedia', () => {
        it('should search media', async () => {
            const media = [{ id: 1, filename: 'search-result.jpg' }];
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.query = { q: 'search', page: '1', limit: '20' };

            mockMediaService.searchMedia.mockResolvedValue({
                media: media as any,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });

            await mediaController.searchMedia(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: media,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });
        });

        it('should reject without search query', async () => {
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.query = {};

            await mediaController.searchMedia(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('deleteMedia', () => {
        it('should delete media successfully', async () => {
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };
            req.params = { id: '1' };

            mockMediaService.deleteMedia.mockResolvedValue({
                message: 'Media deleted successfully',
            });

            await mediaController.deleteMedia(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Media deleted successfully',
            });
        });
    });

    describe('getMediaStats', () => {
        it('should get media statistics', async () => {
            const stats = {
                total: 100,
                totalSize: 1024000,
                byType: { 'image/jpeg': 50, 'image/png': 50 },
            };

            req.user = { id: 1, email: 'user@example.com', role: UserRole.ADMIN };

            mockMediaService.getMediaStats.mockResolvedValue(stats as any);

            await mediaController.getMediaStats(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: stats,
            });
        });
    });
});

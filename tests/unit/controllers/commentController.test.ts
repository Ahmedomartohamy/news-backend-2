import { Request, Response } from 'express';
import * as commentController from '../../../src/controllers/commentController';
import commentService from '../../../src/services/commentService';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';
import { CommentStatus, UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/services/commentService');

const mockCommentService = commentService as jest.Mocked<typeof commentService>;

describe('Comment Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('getAllComments', () => {
        it('should get all comments with pagination', async () => {
            const comments = [
                { id: 1, content: 'Comment 1' },
                { id: 2, content: 'Comment 2' },
            ];

            req.query = { page: '1', limit: '10' };

            mockCommentService.getAllComments.mockResolvedValue({
                comments: comments as any,
                pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
            });

            await commentController.getAllComments(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: comments,
                pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
            });
        });

        it('should filter comments by status', async () => {
            req.query = { status: CommentStatus.APPROVED };

            mockCommentService.getAllComments.mockResolvedValue({
                comments: [] as any,
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            });

            await commentController.getAllComments(req as Request, res as Response, next);

            expect(mockCommentService.getAllComments).toHaveBeenCalledWith(
                { status: CommentStatus.APPROVED },
                { page: 1, limit: 10 }
            );
        });
    });

    describe('getArticleComments', () => {
        it('should get comments for article', async () => {
            const comments = [{ id: 1, content: 'Comment' }];
            req.params = { articleId: '1' };

            mockCommentService.getArticleComments.mockResolvedValue(comments as any);

            await commentController.getArticleComments(req as Request, res as Response, next);

            expect(mockCommentService.getArticleComments).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: comments,
            });
        });
    });

    describe('getCommentById', () => {
        it('should get comment by id', async () => {
            const comment = { id: 1, content: 'Comment' };
            req.params = { id: '1' };

            mockCommentService.getCommentById.mockResolvedValue(comment as any);

            await commentController.getCommentById(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: comment,
            });
        });
    });

    describe('createComment', () => {
        it('should create comment as authenticated user', async () => {
            const newComment = { id: 1, content: 'New comment' };
            req.body = { articleId: 1, content: 'New comment' };
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };

            mockCommentService.createComment.mockResolvedValue(newComment as any);

            await commentController.createComment(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: newComment,
                message: 'Comment created successfully. It will be visible after moderation.',
            });
        });

        it('should create comment as guest', async () => {
            const newComment = { id: 1, content: 'Guest comment' };
            req.body = {
                articleId: 1,
                content: 'Guest comment',
                authorName: 'Guest',
                authorEmail: 'guest@example.com',
            };

            mockCommentService.createComment.mockResolvedValue(newComment as any);

            await commentController.createComment(req as Request, res as Response, next);

            expect(mockCommentService.createComment).toHaveBeenCalledWith(req.body, undefined);
        });
    });

    describe('updateComment', () => {
        it('should update comment successfully', async () => {
            const updatedComment = { id: 1, content: 'Updated content' };
            req.params = { id: '1' };
            req.body = { content: 'Updated content' };
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };

            mockCommentService.updateComment.mockResolvedValue(updatedComment as any);

            await commentController.updateComment(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedComment,
                message: 'Comment updated successfully',
            });
        });

        it('should reject unauthenticated update', async () => {
            req.params = { id: '1' };
            req.body = { content: 'Updated' };
            req.user = undefined;

            await commentController.updateComment(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('deleteComment', () => {
        it('should delete comment successfully', async () => {
            req.params = { id: '1' };
            req.user = { id: 1, email: 'user@example.com', role: UserRole.AUTHOR };

            mockCommentService.deleteComment.mockResolvedValue({
                message: 'Comment deleted successfully',
            });

            await commentController.deleteComment(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Comment deleted successfully',
            });
        });
    });

    describe('approveComment', () => {
        it('should approve comment', async () => {
            const approvedComment = { id: 1, status: CommentStatus.APPROVED };
            req.params = { id: '1' };

            mockCommentService.approveComment.mockResolvedValue(approvedComment as any);

            await commentController.approveComment(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: approvedComment,
                message: 'Comment approved successfully',
            });
        });
    });

    describe('rejectComment', () => {
        it('should reject comment', async () => {
            const rejectedComment = { id: 1, status: CommentStatus.REJECTED };
            req.params = { id: '1' };

            mockCommentService.rejectComment.mockResolvedValue(rejectedComment as any);

            await commentController.rejectComment(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: rejectedComment,
                message: 'Comment rejected successfully',
            });
        });
    });

    describe('markAsSpam', () => {
        it('should mark comment as spam', async () => {
            const spamComment = { id: 1, status: CommentStatus.SPAM };
            req.params = { id: '1' };

            mockCommentService.markAsSpam.mockResolvedValue(spamComment as any);

            await commentController.markAsSpam(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: spamComment,
                message: 'Comment marked as spam',
            });
        });
    });

    describe('getCommentStats', () => {
        it('should get comment statistics', async () => {
            const stats = {
                total: 100,
                pending: 20,
                approved: 70,
                rejected: 5,
                spam: 5,
            };

            mockCommentService.getCommentStats.mockResolvedValue(stats);

            await commentController.getCommentStats(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: stats,
            });
        });
    });
});

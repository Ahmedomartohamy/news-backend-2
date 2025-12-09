import commentService from '../../../src/services/commentService';
import prisma from '../../../src/config/prisma';
import { CommentStatus } from '@prisma/client';
import { mockComment } from '../../helpers/prisma.mock';

// Mock dependencies
jest.mock('../../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        comment: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        article: {
            findUnique: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as any;

describe('Comment Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createComment', () => {
        it('should create authenticated user comment successfully', async () => {
            const commentData = {
                articleId: 1,
                content: 'Great article!',
            };

            mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.comment.create.mockResolvedValue(mockComment());

            const result = await commentService.createComment(commentData, 1);

            expect(result).toBeDefined();
            expect(mockPrisma.comment.create).toHaveBeenCalled();
        });

        it('should create guest comment with name and email', async () => {
            const commentData = {
                articleId: 1,
                content: 'Great article!',
                authorName: 'Guest User',
                authorEmail: 'guest@example.com',
            };

            mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.comment.create.mockResolvedValue(mockComment(commentData));

            const result = await commentService.createComment(commentData);

            expect(result).toBeDefined();
        });

        it('should throw error if article not found', async () => {
            const commentData = {
                articleId: 999,
                content: 'Comment',
            };

            mockPrisma.article.findUnique.mockResolvedValue(null);

            await expect(commentService.createComment(commentData, 1)).rejects.toThrow('Article not found');
        });

        it('should throw error for guest comment without name/email', async () => {
            const commentData = {
                articleId: 1,
                content: 'Comment',
            };

            mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });

            await expect(commentService.createComment(commentData)).rejects.toThrow(
                'Guest comments require name and email'
            );
        });

        it('should throw error if parent comment not found', async () => {
            const commentData = {
                articleId: 1,
                content: 'Reply',
                parentId: 999,
            };

            mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.comment.findUnique.mockResolvedValue(null);

            await expect(commentService.createComment(commentData, 1)).rejects.toThrow('Parent comment not found');
        });

        it('should throw error if parent comment belongs to different article', async () => {
            const commentData = {
                articleId: 1,
                content: 'Reply',
                parentId: 1,
            };

            mockPrisma.article.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.comment.findUnique.mockResolvedValue(mockComment({ articleId: 2 }));

            await expect(commentService.createComment(commentData, 1)).rejects.toThrow(
                'Parent comment belongs to different article'
            );
        });
    });

    describe('getAllComments', () => {
        it('should get all comments with pagination', async () => {
            const comments = [mockComment(), mockComment({ id: 2 })];
            mockPrisma.comment.findMany.mockResolvedValue(comments);
            mockPrisma.comment.count.mockResolvedValue(2);

            const result = await commentService.getAllComments({}, { page: 1, limit: 10 });

            expect(result.comments).toEqual(comments);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
            });
        });

        it('should filter comments by status', async () => {
            mockPrisma.comment.findMany.mockResolvedValue([]);
            mockPrisma.comment.count.mockResolvedValue(0);

            await commentService.getAllComments({ status: CommentStatus.APPROVED }, { page: 1, limit: 10 });

            expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: CommentStatus.APPROVED },
                })
            );
        });

        it('should filter comments by article', async () => {
            mockPrisma.comment.findMany.mockResolvedValue([]);
            mockPrisma.comment.count.mockResolvedValue(0);

            await commentService.getAllComments({ articleId: 1 }, { page: 1, limit: 10 });

            expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { articleId: 1 },
                })
            );
        });
    });

    describe('getArticleComments', () => {
        it('should get approved comments for article', async () => {
            const comments = [mockComment({ status: CommentStatus.APPROVED })];
            mockPrisma.comment.findMany.mockResolvedValue(comments);

            const result = await commentService.getArticleComments(1);

            expect(result).toEqual(comments);
            expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        articleId: 1,
                        status: CommentStatus.APPROVED,
                        parentId: null,
                    }),
                })
            );
        });
    });

    describe('getCommentById', () => {
        it('should get comment by id', async () => {
            const comment = mockComment();
            mockPrisma.comment.findUnique.mockResolvedValue(comment);

            const result = await commentService.getCommentById(1);

            expect(result).toEqual(comment);
        });

        it('should throw error if comment not found', async () => {
            mockPrisma.comment.findUnique.mockResolvedValue(null);

            await expect(commentService.getCommentById(999)).rejects.toThrow('Comment not found');
        });
    });

    describe('updateComment', () => {
        it('should update own comment', async () => {
            const comment = mockComment({ userId: 1 });
            const updatedComment = { ...comment, content: 'Updated content' };

            mockPrisma.comment.findUnique.mockResolvedValue(comment);
            mockPrisma.comment.update.mockResolvedValue(updatedComment);

            const result = await commentService.updateComment(1, { content: 'Updated content' }, 1, 'AUTHOR');

            expect(result.content).toBe('Updated content');
        });

        it('should reject updating another user comment', async () => {
            const comment = mockComment({ userId: 2 });
            mockPrisma.comment.findUnique.mockResolvedValue(comment);

            await expect(
                commentService.updateComment(1, { content: 'Updated' }, 1, 'AUTHOR')
            ).rejects.toThrow('You can only edit your own comments');
        });

        it('should allow admin to update any comment', async () => {
            const comment = mockComment({ userId: 2 });
            const updatedComment = { ...comment, content: 'Admin updated' };

            mockPrisma.comment.findUnique.mockResolvedValue(comment);
            mockPrisma.comment.update.mockResolvedValue(updatedComment);

            const result = await commentService.updateComment(1, { content: 'Admin updated' }, 1, 'ADMIN');

            expect(result.content).toBe('Admin updated');
        });

        it('should throw error if comment not found', async () => {
            mockPrisma.comment.findUnique.mockResolvedValue(null);

            await expect(
                commentService.updateComment(999, { content: 'Updated' }, 1, 'AUTHOR')
            ).rejects.toThrow('Comment not found');
        });
    });

    describe('approveComment', () => {
        it('should approve comment', async () => {
            const approvedComment = mockComment({ status: CommentStatus.APPROVED });
            mockPrisma.comment.update.mockResolvedValue(approvedComment);

            const result = await commentService.approveComment(1);

            expect(result.status).toBe(CommentStatus.APPROVED);
        });
    });

    describe('rejectComment', () => {
        it('should reject comment', async () => {
            const rejectedComment = mockComment({ status: CommentStatus.REJECTED });
            mockPrisma.comment.update.mockResolvedValue(rejectedComment);

            const result = await commentService.rejectComment(1);

            expect(result.status).toBe(CommentStatus.REJECTED);
        });
    });

    describe('markAsSpam', () => {
        it('should mark comment as spam', async () => {
            const spamComment = mockComment({ status: CommentStatus.SPAM });
            mockPrisma.comment.update.mockResolvedValue(spamComment);

            const result = await commentService.markAsSpam(1);

            expect(result.status).toBe(CommentStatus.SPAM);
        });
    });

    describe('deleteComment', () => {
        it('should delete own comment', async () => {
            const comment = mockComment({ userId: 1 });
            mockPrisma.comment.findUnique.mockResolvedValue({ ...comment, _count: { replies: 0 } });
            mockPrisma.comment.delete.mockResolvedValue(comment);

            const result = await commentService.deleteComment(1, 1, 'AUTHOR');

            expect(result.message).toBe('Comment deleted successfully');
        });

        it('should reject deleting comment with replies', async () => {
            const comment = mockComment({ userId: 1 });
            mockPrisma.comment.findUnique.mockResolvedValue({ ...comment, _count: { replies: 3 } });

            await expect(commentService.deleteComment(1, 1, 'AUTHOR')).rejects.toThrow(
                'Cannot delete comment with 3 replies'
            );
        });

        it('should reject deleting another user comment', async () => {
            const comment = mockComment({ userId: 2 });
            mockPrisma.comment.findUnique.mockResolvedValue({ ...comment, _count: { replies: 0 } });

            await expect(commentService.deleteComment(1, 1, 'AUTHOR')).rejects.toThrow(
                'You can only delete your own comments'
            );
        });

        it('should throw error if comment not found', async () => {
            mockPrisma.comment.findUnique.mockResolvedValue(null);

            await expect(commentService.deleteComment(999, 1, 'AUTHOR')).rejects.toThrow('Comment not found');
        });
    });

    describe('getCommentStats', () => {
        it('should get comment statistics', async () => {
            mockPrisma.comment.count
                .mockResolvedValueOnce(100)
                .mockResolvedValueOnce(20)
                .mockResolvedValueOnce(70)
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(5);

            const result = await commentService.getCommentStats();

            expect(result).toEqual({
                total: 100,
                pending: 20,
                approved: 70,
                rejected: 5,
                spam: 5,
            });
        });
    });
});

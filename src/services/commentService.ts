import { CommentStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { CreateCommentRequest, PaginationQuery } from '../types/requests';

export class CommentService {
  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentRequest, userId?: number) {
    // Verify article exists
    const article = await prisma.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      throw new ApiError(404, 'Article not found');
    }

    // Verify parent comment exists if provided
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new ApiError(404, 'Parent comment not found');
      }

      if (parentComment.articleId !== data.articleId) {
        throw new ApiError(400, 'Parent comment belongs to different article');
      }
    }

    // For guest comments, require name and email
    if (!userId && (!data.authorName || !data.authorEmail)) {
      throw new ApiError(400, 'Guest comments require name and email');
    }

    const comment = await prisma.comment.create({
      data: {
        articleId: data.articleId,
        userId,
        parentId: data.parentId,
        content: data.content,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        status: CommentStatus.PENDING, // Default to pending for moderation
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Get all comments with filters
   */
  async getAllComments(
    filters: {
      status?: CommentStatus;
      articleId?: number;
    },
    query: PaginationQuery
  ) {
    const { skip, take, page, limit } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.articleId) {
      where.articleId = filters.articleId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: getPaginationMeta(page, limit, total),
    };
  }

  /**
   * Get comments for an article (including nested replies)
   */
  async getArticleComments(articleId: number) {
    // Only get approved comments for public view
    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        status: CommentStatus.APPROVED,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: {
            status: CommentStatus.APPROVED,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            replies: {
              where: {
                status: CommentStatus.APPROVED,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  /**
   * Get comment by ID
   */
  async getCommentById(id: number) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(
    id: number,
    data: {
      content: string;
    },
    userId: number,
    userRole: string
  ) {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    // Check permissions
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You can only edit your own comments');
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedComment;
  }

  /**
   * Approve comment
   */
  async approveComment(id: number) {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status: CommentStatus.APPROVED },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Reject comment
   */
  async rejectComment(id: number) {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status: CommentStatus.REJECTED },
    });

    return comment;
  }

  /**
   * Mark comment as spam
   */
  async markAsSpam(id: number) {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status: CommentStatus.SPAM },
    });

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(id: number, userId: number, userRole: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    // Check permissions
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You can only delete your own comments');
    }

    // Warn if comment has replies
    if (comment._count.replies > 0) {
      throw new ApiError(
        400,
        `Cannot delete comment with ${comment._count.replies} replies. Delete replies first.`
      );
    }

    await prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Get comment statistics
   */
  async getCommentStats() {
    const [total, pending, approved, rejected, spam] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      prisma.comment.count({ where: { status: CommentStatus.APPROVED } }),
      prisma.comment.count({ where: { status: CommentStatus.REJECTED } }),
      prisma.comment.count({ where: { status: CommentStatus.SPAM } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      spam,
    };
  }
}

export default new CommentService();
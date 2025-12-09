import { Request, Response } from 'express';
import { CommentStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import commentService from '../services/commentService';
import { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema';
import { PaginationQuery } from '../types/requests';

/**
 * Get all comments (Admin only)
 * GET /api/comments
 */
export const getAllComments = asyncHandler(async (req: Request, res: Response) => {
  const filters: {
    status?: CommentStatus;
    articleId?: number;
  } = {};

  if (req.query.status) {
    filters.status = req.query.status as CommentStatus;
  }
  if (req.query.articleId) {
    filters.articleId = parseInt(req.query.articleId as string);
  }

  const query: PaginationQuery = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  };

  const result = await commentService.getAllComments(filters, query);

  res.json({
    success: true,
    data: result.comments,
    pagination: result.pagination,
  });
});

/**
 * Get comments for an article
 * GET /api/articles/:articleId/comments
 */
export const getArticleComments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.articleId) {
    throw new ApiError(400, 'Article ID is required');
  }

  const articleId = parseInt(req.params.articleId);

  const comments = await commentService.getArticleComments(articleId);

  res.json({
    success: true,
    data: comments,
  });
});

/**
 * Get comment by ID
 * GET /api/comments/:id
 */
export const getCommentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);

  const comment = await commentService.getCommentById(id);

  res.json({
    success: true,
    data: comment,
  });
});

/**
 * Create comment
 * POST /api/comments
 */
export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateCommentInput = req.body;
  const userId = req.user?.id;

  const comment = await commentService.createComment(data, userId);

  res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment created successfully. It will be visible after moderation.',
  });
});

/**
 * Update comment
 * PUT /api/comments/:id
 */
export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);
  const { content }: UpdateCommentInput = req.body;

  const comment = await commentService.updateComment(id, { content }, req.user.id, req.user.role);

  res.json({
    success: true,
    data: comment,
    message: 'Comment updated successfully',
  });
});

/**
 * Delete comment
 * DELETE /api/comments/:id
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);

  const result = await commentService.deleteComment(id, req.user.id, req.user.role);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Approve comment (Admin/Editor only)
 * PATCH /api/comments/:id/approve
 */
export const approveComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);

  const comment = await commentService.approveComment(id);

  res.json({
    success: true,
    data: comment,
    message: 'Comment approved successfully',
  });
});

/**
 * Reject comment (Admin/Editor only)
 * PATCH /api/comments/:id/reject
 */
export const rejectComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);

  const comment = await commentService.rejectComment(id);

  res.json({
    success: true,
    data: comment,
    message: 'Comment rejected successfully',
  });
});

/**
 * Mark comment as spam (Admin/Editor only)
 * PATCH /api/comments/:id/spam
 */
export const markAsSpam = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    throw new ApiError(400, 'Comment ID is required');
  }

  const id = parseInt(req.params.id);

  const comment = await commentService.markAsSpam(id);

  res.json({
    success: true,
    data: comment,
    message: 'Comment marked as spam',
  });
});

/**
 * Get comment statistics (Admin only)
 * GET /api/comments/stats
 */
export const getCommentStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await commentService.getCommentStats();

  res.json({
    success: true,
    data: stats,
  });
});
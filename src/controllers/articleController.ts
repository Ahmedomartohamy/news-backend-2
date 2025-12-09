import { Request, Response } from 'express';
import { ArticleStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import articleService from '../services/articleService';
import { CreateArticleInput, UpdateArticleInput } from '../schemas/article.schema';
import { ArticleFilters, PaginationQuery } from '../types/requests';

/**
 * Get all articles with filters
 * GET /api/articles
 */
export const getAllArticles = asyncHandler(async (req: Request, res: Response) => {
    const filters: ArticleFilters = {};

    if (req.query.status) {
        filters.status = req.query.status as ArticleStatus;
    }
    if (req.query.categoryId) {
        filters.categoryId = parseInt(req.query.categoryId as string);
    }
    if (req.query.authorId) {
        filters.authorId = parseInt(req.query.authorId as string);
    }
    if (req.query.tagId) {
        filters.tagId = parseInt(req.query.tagId as string);
    }
    if (req.query.search) {
        filters.search = req.query.search as string;
    }

    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort as string,
        order: req.query.order as 'asc' | 'desc',
    };

    // Public users can only see published articles
    if (!req.user) {
        filters.status = ArticleStatus.PUBLISHED;
    }

    const result = await articleService.getAllArticles(filters, query);

    res.json({
        success: true,
        data: result.articles,
        pagination: result.pagination,
    });
});

/**
 * Get article by slug
 * GET /api/articles/:slug
 */
export const getArticleBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
        throw new ApiError(400, 'Slug is required');
    }

    // Increment view count only for published articles and non-authenticated users
    const incrementView = !req.user;

    const article = await articleService.getArticleBySlug(slug, incrementView);

    // Non-authenticated users can only see published articles
    if (!req.user && article.status !== ArticleStatus.PUBLISHED) {
        throw new ApiError(404, 'Article not found');
    }

    res.json({
        success: true,
        data: article,
    });
});

/**
 * Create article
 * POST /api/articles
 */
export const createArticle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const data: CreateArticleInput = req.body;

    const article = await articleService.createArticle(data, req.user.id);

    res.status(201).json({
        success: true,
        data: article,
        message: 'Article created successfully',
    });
});

/**
 * Update article
 * PUT /api/articles/:id
 */
export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Article ID is required');
    }

    const id = parseInt(req.params.id);
    const data: UpdateArticleInput = req.body;

    const article = await articleService.updateArticle(id, data, req.user.id, req.user.role);

    res.json({
        success: true,
        data: article,
        message: 'Article updated successfully',
    });
});

/**
 * Publish article
 * PATCH /api/articles/:id/publish
 */
export const publishArticle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Article ID is required');
    }

    const id = parseInt(req.params.id);

    const article = await articleService.publishArticle(id);

    res.json({
        success: true,
        data: article,
        message: 'Article published successfully',
    });
});

/**
 * Archive article
 * PATCH /api/articles/:id/archive
 */
export const archiveArticle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Article ID is required');
    }

    const id = parseInt(req.params.id);

    const article = await articleService.archiveArticle(id);

    res.json({
        success: true,
        data: article,
        message: 'Article archived successfully',
    });
});

/**
 * Delete article
 * DELETE /api/articles/:id
 */
export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Article ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await articleService.deleteArticle(id, req.user.id, req.user.role);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Get related articles
 * GET /api/articles/:id/related
 */
export const getRelatedArticles = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'Article ID is required');
    }

    const id = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 5;

    const articles = await articleService.getRelatedArticles(id, limit);

    res.json({
        success: true,
        data: articles,
    });
});

/**
 * Search articles
 * GET /api/articles/search
 */
export const searchArticles = asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.q as string;

    if (!search) {
        throw new ApiError(400, 'Search query is required');
    }

    const filters: ArticleFilters = {
        search,
    };

    // Public can only search published articles
    if (!req.user) {
        filters.status = ArticleStatus.PUBLISHED;
    }

    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await articleService.getAllArticles(filters, query);

    res.json({
        success: true,
        data: result.articles,
        pagination: result.pagination,
    });
});

/**
 * Get article statistics
 * GET /api/articles/stats
 */
export const getArticleStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await articleService.getArticleStats();

    res.json({
        success: true,
        data: stats,
    });
});
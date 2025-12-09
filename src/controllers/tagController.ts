import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import tagService from '../services/tagService';
import { CreateTagInput, UpdateTagInput } from '../schemas/tag.schema';

/**
 * Get all tags
 * GET /api/tags
 */
export const getAllTags = asyncHandler(async (_req: Request, res: Response) => {
    const tags = await tagService.getAllTags();

    res.json({
        success: true,
        data: tags,
    });
});

/**
 * Get popular tags
 * GET /api/tags/popular
 */
export const getPopularTags = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const tags = await tagService.getPopularTags(limit);

    res.json({
        success: true,
        data: tags,
    });
});

/**
 * Get tag by slug
 * GET /api/tags/:slug
 */
export const getTagBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
        throw new ApiError(400, 'Tag slug is required');
    }

    const tag = await tagService.getTagBySlug(slug);

    res.json({
        success: true,
        data: tag,
    });
});

/**
 * Get articles by tag
 * GET /api/tags/:slug/articles
 */
export const getArticlesByTag = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!slug) {
        throw new ApiError(400, 'Tag slug is required');
    }

    const result = await tagService.getArticlesByTag(slug, page, limit);

    res.json({
        success: true,
        data: result,
    });
});

/**
 * Create tag
 * POST /api/tags
 */
export const createTag = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateTagInput = req.body;

    const tag = await tagService.createTag(data);

    res.status(201).json({
        success: true,
        data: tag,
        message: 'Tag created successfully',
    });
});

/**
 * Update tag (Admin only)
 * PUT /api/tags/:id
 */
export const updateTag = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'Tag ID is required');
    }

    const id = parseInt(req.params.id);
    const { name }: UpdateTagInput = req.body;

    const tag = await tagService.updateTag(id, { name });

    res.json({
        success: true,
        data: tag,
        message: 'Tag updated successfully',
    });
});

/**
 * Delete tag (Admin only)
 * DELETE /api/tags/:id
 */
export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'Tag ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await tagService.deleteTag(id);

    res.json({
        success: true,
        message: result.message,
    });
});
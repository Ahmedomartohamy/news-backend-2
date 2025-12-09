import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import categoryService from '../services/categoryService';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

/**
 * Get all categories
 * GET /api/categories
 */
export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    res.json({
        success: true,
        data: categories,
    });
});

/**
 * Get category tree (hierarchical)
 * GET /api/categories/tree
 */
export const getCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
    const tree = await categoryService.getCategoryTree();

    res.json({
        success: true,
        data: tree,
    });
});

/**
 * Get category by slug
 * GET /api/categories/:slug
 */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
        throw new ApiError(400, 'Category slug is required');
    }

    const category = await categoryService.getCategoryBySlug(slug);

    res.json({
        success: true,
        data: category,
    });
});

/**
 * Get articles by category
 * GET /api/categories/:slug/articles
 */
export const getArticlesByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!slug) {
        throw new ApiError(400, 'Category slug is required');
    }

    const result = await categoryService.getArticlesByCategory(slug, page, limit);

    res.json({
        success: true,
        data: result,
    });
});

/**
 * Create category (Admin only)
 * POST /api/categories
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateCategoryInput = req.body;

    const category = await categoryService.createCategory(data);

    res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
    });
});

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'Category ID is required');
    }

    const id = parseInt(req.params.id);
    const { name, description, parentId }: UpdateCategoryInput = req.body;

    const category = await categoryService.updateCategory(id, {
        name,
        description,
        parentId,
    });

    res.json({
        success: true,
        data: category,
        message: 'Category updated successfully',
    });
});

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'Category ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await categoryService.deleteCategory(id);

    res.json({
        success: true,
        message: result.message,
    });
});
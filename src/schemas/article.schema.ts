import { z } from 'zod';

/**
 * Article status enum
 */
const articleStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

/**
 * Schema for creating a new article
 */
export const createArticleSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
    featuredImage: z.string().url('Featured image must be a valid URL').optional(),
    categoryId: z.number().int('Category ID must be a number'),
    tagIds: z.array(z.number().int()).optional(),
    status: articleStatusEnum.optional(),
});

/**
 * Schema for updating an article
 */
export const updateArticleSchema = z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
    excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
    featuredImage: z.string().url('Featured image must be a valid URL').optional(),
    categoryId: z.number().int('Category ID must be a number').optional(),
    tagIds: z.array(z.number().int()).optional(),
    status: articleStatusEnum.optional(),
});

/**
 * Schema for article ID parameter
 */
export const articleParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid article ID').transform(Number),
});

/**
 * Schema for article slug parameter
 */
export const articleSlugParamsSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
});

/**
 * Schema for article query parameters
 */
export const articleQuerySchema = z.object({
    status: articleStatusEnum.optional(),
    categoryId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    authorId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    tagId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    search: z.string().optional(),
    q: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type inference exports
 */
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleParams = z.infer<typeof articleParamsSchema>;
export type ArticleSlugParams = z.infer<typeof articleSlugParamsSchema>;
export type ArticleQuery = z.infer<typeof articleQuerySchema>;

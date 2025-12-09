import { z } from 'zod';

/**
 * Schema for creating a new category
 */
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    parentId: z.number().int('Parent ID must be a number').optional(),
});

/**
 * Schema for updating a category
 */
export const updateCategorySchema = z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    description: z.string().optional(),
    parentId: z.number().int('Parent ID must be a number').optional(),
});

/**
 * Schema for category ID parameter
 */
export const categoryParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid category ID').transform(Number),
});

/**
 * Schema for category slug parameter
 */
export const categorySlugParamsSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
});

/**
 * Type inference exports
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;

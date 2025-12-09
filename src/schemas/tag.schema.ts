import { z } from 'zod';

/**
 * Schema for creating a new tag
 */
export const createTagSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

/**
 * Schema for updating a tag
 */
export const updateTagSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

/**
 * Schema for tag ID parameter
 */
export const tagParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid tag ID').transform(Number),
});

/**
 * Schema for tag slug parameter
 */
export const tagSlugParamsSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
});

/**
 * Type inference exports
 */
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagParams = z.infer<typeof tagParamsSchema>;
export type TagSlugParams = z.infer<typeof tagSlugParamsSchema>;

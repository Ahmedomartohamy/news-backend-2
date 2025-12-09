import { z } from 'zod';

/**
 * Common schema for integer ID parameters
 */
export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number),
});

/**
 * Common schema for slug parameters
 */
export const slugParamSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
});

/**
 * Common schema for pagination query parameters
 */
export const paginationSchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type inference exports
 */
export type IdParam = z.infer<typeof idParamSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;

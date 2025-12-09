import { z } from 'zod';

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = z.object({
    articleId: z.number().int('Article ID is required'),
    content: z.string().min(1, 'Content is required'),
    parentId: z.number().int('Parent ID must be a number').optional(),
    authorName: z.string().min(1, 'Author name cannot be empty').optional(),
    authorEmail: z.string().email('Invalid email').optional(),
});

/**
 * Schema for updating a comment
 */
export const updateCommentSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

/**
 * Schema for comment ID parameter
 */
export const commentParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid comment ID').transform(Number),
});

/**
 * Type inference exports
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentParams = z.infer<typeof commentParamsSchema>;

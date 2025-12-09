import { z } from 'zod';

/**
 * Schema for media ID parameter
 */
export const mediaParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid media ID').transform(Number),
});

/**
 * Type inference exports
 */
export type MediaParams = z.infer<typeof mediaParamsSchema>;

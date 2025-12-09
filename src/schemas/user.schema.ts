import { z } from 'zod';

/**
 * User role enum
 */
const userRoleEnum = z.enum(['ADMIN', 'EDITOR', 'AUTHOR']);

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(1, 'Name is required'),
    role: userRoleEnum.optional(),
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

/**
 * Schema for changing user role
 */
export const changeRoleSchema = z.object({
    role: userRoleEnum,
});

/**
 * Schema for user ID parameter
 */
export const userParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
});

/**
 * Type inference exports
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;

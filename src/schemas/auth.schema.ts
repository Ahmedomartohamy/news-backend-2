import { z } from 'zod';

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(1, 'Name is required'),
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

/**
 * Type inference exports
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

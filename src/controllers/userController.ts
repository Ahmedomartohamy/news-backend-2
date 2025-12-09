import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import userService from '../services/userService';
import { CreateUserInput, UpdateUserInput, ChangeRoleInput } from '../schemas/user.schema';
import { PaginationQuery } from '../types/requests';

/**
 * Get all users (Admin only)
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await userService.getAllUsers(query);

    res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
    });
});

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);

    const user = await userService.getUserById(id);

    res.json({
        success: true,
        data: user,
    });
});

/**
 * Create user (Admin only)
 * POST /api/users
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role }: CreateUserInput = req.body;

    const user = await userService.createUser({
        email,
        password,
        name,
        role,
    });

    res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
    });
});

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);
    const { name, bio, avatarUrl }: UpdateUserInput = req.body;

    const user = await userService.updateUser(id, {
        name,
        bio,
        avatarUrl,
    });

    res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
    });
});

/**
 * Change user role (Admin only)
 * PATCH /api/users/:id/role
 */
export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);
    const { role }: ChangeRoleInput = req.body;

    const user = await userService.changeUserRole(id, role);

    res.json({
        success: true,
        data: user,
        message: 'User role updated successfully',
    });
});

/**
 * Deactivate user (Admin only)
 * PATCH /api/users/:id/deactivate
 */
export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await userService.deactivateUser(id);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Activate user (Admin only)
 * PATCH /api/users/:id/activate
 */
export const activateUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await userService.activateUser(id);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.id) {
        throw new ApiError(400, 'User ID is required');
    }

    const id = parseInt(req.params.id);

    // Prevent deleting yourself
    if (req.user && req.user.id === id) {
        throw new ApiError(400, 'You cannot delete your own account');
    }

    const result = await userService.deleteUser(id);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Get user statistics (Admin only)
 * GET /api/users/stats
 */
export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await userService.getUserStats();

    res.json({
        success: true,
        data: stats,
    });
});
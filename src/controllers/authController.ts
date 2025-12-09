import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import userService from '../services/userService';
import { generateToken, generateRefreshToken } from '../config/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas/auth.schema';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterInput = req.body;

    const user = await userService.createUser(data);

    // Generate tokens
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    res.status(201).json({
        success: true,
        data: {
            user,
            accessToken: token,
            refreshToken,
        },
        message: 'User registered successfully',
    });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginInput = req.body;

    // Get user with password
    const user = await userService.getUserByEmail(email);

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await userService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        success: true,
        data: {
            user: userWithoutPassword,
            accessToken: token,
            refreshToken,
        },
        message: 'Login successful',
    });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const user = await userService.getUserById(req.user.id);

    res.json({
        success: true,
        data: user,
    });
});

/**
 * Update current user profile
 * PUT /api/auth/me
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const { name, bio, avatarUrl }: UpdateProfileInput = req.body;

    const user = await userService.updateUser(req.user.id, {
        name,
        bio,
        avatarUrl,
    });

    res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
    });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const { oldPassword, newPassword }: ChangePasswordInput = req.body;

    const result = await userService.changePassword(req.user.id, oldPassword, newPassword);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a stateless JWT system, logout is handled client-side
    // Client should delete the token
    // Here we can implement token blacklisting if needed

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
        throw new ApiError(400, 'Refresh token is required');
    }

    try {
        // Import verifyRefreshToken
        const { verifyRefreshToken } = await import('../config/jwt');

        // Verify the refresh token
        const payload = verifyRefreshToken(refreshTokenFromBody);

        // Get fresh user data
        const user = await userService.getUserById(payload.userId);

        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        // Generate new tokens
        const newToken = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const newRefreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            success: true,
            data: {
                accessToken: newToken,
                refreshToken: newRefreshToken,
            },
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }
});
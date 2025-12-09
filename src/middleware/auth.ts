import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided. Please login.');
        }

        // 2. Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // 3. Verify token
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            throw new ApiError(401, 'Invalid or expired token. Please login again.');
        }

        // 4. Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // 5. Check if user exists and is active
        if (!user) {
            throw new ApiError(401, 'User not found. Please login again.');
        }

        if (!user.isActive) {
            throw new ApiError(403, 'Your account has been deactivated.');
        }

        // 6. Attach user to request object
        req.user = user;

        // 7. Continue to next middleware/controller
        next();
    } catch (error) {
        next(error);
    }
};

// Optional middleware - doesn't fail if no token
export const optionalAuthenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const decoded = verifyToken(token);
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        avatarUrl: true,
                        bio: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Silently fail - optional auth
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};
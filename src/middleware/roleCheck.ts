import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware to check if user has required role
 * Must be used AFTER authenticate middleware
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                throw new ApiError(401, 'Authentication required');
            }

            // Check if user has one of the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                throw new ApiError(
                    403,
                    `Access denied. Required role: ${allowedRoles.join(' or ')}`
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Check if user is admin or editor
 */
export const requireEditor = requireRole(UserRole.ADMIN, UserRole.EDITOR);

/**
 * Check if user is admin, editor, or author (basically any authenticated user)
 */
export const requireAuthor = requireRole(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR);

/**
 * Check if user owns the resource or is admin
 */
export const requireOwnerOrAdmin = (getUserId: (req: Request) => number) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Authentication required');
            }

            const resourceUserId = getUserId(req);
            const isOwner = req.user.id === resourceUserId;
            const isAdmin = req.user.role === UserRole.ADMIN;

            if (!isOwner && !isAdmin) {
                throw new ApiError(403, 'You can only modify your own resources');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
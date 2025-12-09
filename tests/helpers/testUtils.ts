import { Request, Response } from 'express';
import { generateToken } from '../../src/config/jwt';
import { UserRole } from '@prisma/client';

/**
 * Generate a test JWT token
 */
export const generateTestToken = (userId = 1, email = 'test@example.com', role: UserRole = UserRole.AUTHOR) => {
    return generateToken({ userId, email, role });
};

/**
 * Create mock Express request
 */
export const mockRequest = (overrides = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
});

/**
 * Create mock Express response
 */
export const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        sendStatus: jest.fn().mockReturnThis(),
    };
    return res;
};

/**
 * Create mock Next function
 */
export const mockNext = () => jest.fn();

/**
 * Test user data
 */
export const testUsers = {
    admin: {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        password: '$2a$10$hashedpassword',
        isActive: true,
        avatarUrl: null,
        bio: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    editor: {
        id: 2,
        email: 'editor@example.com',
        name: 'Editor User',
        role: UserRole.EDITOR,
        password: '$2a$10$hashedpassword',
        isActive: true,
        avatarUrl: null,
        bio: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    author: {
        id: 3,
        email: 'author@example.com',
        name: 'Author User',
        role: UserRole.AUTHOR,
        password: '$2a$10$hashedpassword',
        isActive: true,
        avatarUrl: null,
        bio: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    inactive: {
        id: 4,
        email: 'inactive@example.com',
        name: 'Inactive User',
        role: UserRole.AUTHOR,
        password: '$2a$10$hashedpassword',
        isActive: false,
        avatarUrl: null,
        bio: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

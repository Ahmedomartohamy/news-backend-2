import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../../../src/middleware/auth';
import { verifyToken } from '../../../src/config/jwt';
import prisma from '../../../src/config/prisma';
import { ApiError } from '../../../src/utils/ApiError';
import { mockRequest, mockResponse, mockNext, testUsers } from '../../helpers/testUtils';

// Mock dependencies
jest.mock('../../../src/config/jwt');
jest.mock('../../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should authenticate user with valid token', async () => {
            req.headers = {
                authorization: 'Bearer valid-token',
            };

            mockVerifyToken.mockReturnValue({
                userId: 1,
                email: 'test@example.com',
                role: 'AUTHOR',
            });

            mockPrisma.user.findUnique.mockResolvedValue(testUsers.author);

            await authenticate(req as Request, res as Response, next);

            expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: expect.any(Object),
            });
            expect(req.user).toEqual(testUsers.author);
            expect(next).toHaveBeenCalledWith();
        });

        it('should reject request without authorization header', async () => {
            req.headers = {};

            await authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = (next as jest.Mock).mock.calls[0][0];
            expect(error.statusCode).toBe(401);
            expect(error.message).toContain('No token provided');
        });

        it('should reject request with invalid token format', async () => {
            req.headers = {
                authorization: 'InvalidFormat token',
            };

            await authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = (next as jest.Mock).mock.calls[0][0];
            expect(error.statusCode).toBe(401);
        });

        it('should reject expired or invalid token', async () => {
            req.headers = {
                authorization: 'Bearer invalid-token',
            };

            mockVerifyToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = (next as jest.Mock).mock.calls[0][0];
            expect(error.statusCode).toBe(401);
            expect(error.message).toContain('Invalid or expired token');
        });

        it('should reject if user not found', async () => {
            req.headers = {
                authorization: 'Bearer valid-token',
            };

            mockVerifyToken.mockReturnValue({
                userId: 999,
                email: 'nonexistent@example.com',
                role: 'AUTHOR',
            });

            mockPrisma.user.findUnique.mockResolvedValue(null);

            await authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = (next as jest.Mock).mock.calls[0][0];
            expect(error.statusCode).toBe(401);
            expect(error.message).toContain('User not found');
        });

        it('should reject inactive user', async () => {
            req.headers = {
                authorization: 'Bearer valid-token',
            };

            mockVerifyToken.mockReturnValue({
                userId: 4,
                email: 'inactive@example.com',
                role: 'AUTHOR',
            });

            mockPrisma.user.findUnique.mockResolvedValue(testUsers.inactive);

            await authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = (next as jest.Mock).mock.calls[0][0];
            expect(error.statusCode).toBe(403);
            expect(error.message).toContain('deactivated');
        });
    });

    describe('optionalAuthenticate', () => {
        it('should authenticate user with valid token', async () => {
            req.headers = {
                authorization: 'Bearer valid-token',
            };

            mockVerifyToken.mockReturnValue({
                userId: 1,
                email: 'test@example.com',
                role: 'AUTHOR',
            });

            mockPrisma.user.findUnique.mockResolvedValue(testUsers.author);

            await optionalAuthenticate(req as Request, res as Response, next);

            expect(req.user).toEqual(testUsers.author);
            expect(next).toHaveBeenCalledWith();
        });

        it('should continue without authentication if no token', async () => {
            req.headers = {};

            await optionalAuthenticate(req as Request, res as Response, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
            expect(mockVerifyToken).not.toHaveBeenCalled();
        });

        it('should silently fail on invalid token', async () => {
            req.headers = {
                authorization: 'Bearer invalid-token',
            };

            mockVerifyToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await optionalAuthenticate(req as Request, res as Response, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });

        it('should not set user if user is inactive', async () => {
            req.headers = {
                authorization: 'Bearer valid-token',
            };

            mockVerifyToken.mockReturnValue({
                userId: 4,
                email: 'inactive@example.com',
                role: 'AUTHOR',
            });

            mockPrisma.user.findUnique.mockResolvedValue(testUsers.inactive);

            await optionalAuthenticate(req as Request, res as Response, next);

            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalledWith();
        });
    });
});

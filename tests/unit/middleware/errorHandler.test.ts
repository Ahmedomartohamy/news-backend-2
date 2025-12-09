import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { errorHandler, notFound } from '../../../src/middleware/errorHandler';
import { ApiError } from '../../../src/utils/ApiError';

describe('Error Handler Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        req = {
            originalUrl: '/test',
        };
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        res = {
            status: statusMock,
        };
        next = jest.fn();

        // Suppress console.error during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('errorHandler', () => {
        it('should handle ApiError', () => {
            const error = new ApiError(404, 'Not found');

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Not found',
            });
        });

        it('should handle Prisma unique constraint error (P2002)', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                code: 'P2002',
                clientVersion: '5.0.0',
                meta: { target: ['email'] },
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('Duplicate entry'),
                })
            );
        });

        it('should handle Prisma record not found error (P2025)', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
                code: 'P2025',
                clientVersion: '5.0.0',
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Record not found',
                })
            );
        });

        it('should handle Prisma foreign key constraint error (P2003)', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
                code: 'P2003',
                clientVersion: '5.0.0',
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid reference to related record',
                })
            );
        });

        it('should handle Prisma required relation error (P2014)', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Required relation violation', {
                code: 'P2014',
                clientVersion: '5.0.0',
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Related record is required',
                })
            );
        });

        it('should handle unknown Prisma errors', () => {
            const error = new Prisma.PrismaClientKnownRequestError('Unknown error', {
                code: 'P9999',
                clientVersion: '5.0.0',
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Database error occurred',
                })
            );
        });

        it('should handle Prisma validation errors', () => {
            const error = new Prisma.PrismaClientValidationError('Validation failed', {
                clientVersion: '5.0.0',
            });

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid data provided',
                })
            );
        });

        it('should handle JWT errors', () => {
            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid token',
                })
            );
        });

        it('should handle expired token errors', () => {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Token expired',
                })
            );
        });

        it('should handle Multer errors', () => {
            const error = new Error('File too large');
            error.name = 'MulterError';

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('File upload error'),
                })
            );
        });

        it('should handle generic errors', () => {
            const error = new Error('Something went wrong');

            errorHandler(error, req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Internal Server Error',
                })
            );
        });

        it('should include stack trace in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = new Error('Test error');

            errorHandler(error, req as Request, res as Response, next);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    stack: expect.any(String),
                })
            );

            process.env.NODE_ENV = originalEnv;
        });

        it('should not include stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = new Error('Test error');

            errorHandler(error, req as Request, res as Response, next);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    stack: expect.any(String),
                })
            );

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('notFound', () => {
        it('should create 404 error for undefined routes', () => {
            req.originalUrl = '/api/nonexistent';

            notFound(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
            expect(error.message).toContain('/api/nonexistent');
        });
    });
});

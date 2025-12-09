import { Request, Response, NextFunction } from 'express';
import { validate } from '../../../src/middleware/validate';
import { z } from 'zod';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';

describe('Validate Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
    });

    describe('body validation', () => {
        const testSchema = z.object({
            email: z.string().email(),
            age: z.number().min(18),
        });

        it('should pass validation with valid data', () => {
            req.body = {
                email: 'test@example.com',
                age: 25,
            };

            const middleware = validate(testSchema, 'body');
            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject invalid data', () => {
            req.body = {
                email: 'invalid-email',
                age: 15,
            };

            const middleware = validate(testSchema, 'body');
            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: expect.any(String),
                        message: expect.any(String),
                    }),
                ]),
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject missing required fields', () => {
            req.body = {};

            const middleware = validate(testSchema, 'body');
            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                errors: expect.any(Array),
            });
        });

        it('should transform data if schema has transformations', () => {
            const transformSchema = z.object({
                id: z.string().transform(Number),
            });

            req.body = { id: '123' };

            const middleware = validate(transformSchema, 'body');
            middleware(req as Request, res as Response, next);

            expect(req.body.id).toBe(123);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('params validation', () => {
        const paramsSchema = z.object({
            id: z.string().regex(/^\d+$/).transform(Number),
        });

        it('should validate params', () => {
            req.params = { id: '123' };

            const middleware = validate(paramsSchema, 'params');
            middleware(req as Request, res as Response, next);

            expect(req.params.id).toBe(123);
            expect(next).toHaveBeenCalledWith();
        });

        it('should reject invalid params', () => {
            req.params = { id: 'abc' };

            const middleware = validate(paramsSchema, 'params');
            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('query validation', () => {
        const querySchema = z.object({
            page: z.string().optional().transform(val => val ? parseInt(val) : 1),
            limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
        });

        it('should validate query parameters', () => {
            req.query = { page: '2', limit: '20' };

            const middleware = validate(querySchema, 'query');
            middleware(req as Request, res as Response, next);

            expect(req.query.page).toBe(2);
            expect(req.query.limit).toBe(20);
            expect(next).toHaveBeenCalledWith();
        });

        it('should handle optional query parameters', () => {
            req.query = {};

            const middleware = validate(querySchema, 'query');
            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('error handling', () => {
        it('should format multiple validation errors', () => {
            const schema = z.object({
                email: z.string().email(),
                password: z.string().min(8),
                age: z.number().min(18),
            });

            req.body = {
                email: 'invalid',
                password: 'short',
                age: 15,
            };

            const middleware = validate(schema, 'body');
            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.errors.length).toBeGreaterThan(0);
        });
    });
});

import { ApiError } from '../../../src/utils/ApiError';

describe('ApiError', () => {
    it('should create an error with status code and message', () => {
        const error = new ApiError(404, 'Not found');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not found');
        expect(error.name).toBe('ApiError');
    });

    it('should create an error with default message', () => {
        const error = new ApiError(500);

        expect(error.statusCode).toBe(500);
        expect(error.message).toBeDefined();
    });

    it('should have correct stack trace', () => {
        const error = new ApiError(400, 'Bad request');

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('ApiError');
    });

    it('should work with different status codes', () => {
        const errors = [
            new ApiError(400, 'Bad Request'),
            new ApiError(401, 'Unauthorized'),
            new ApiError(403, 'Forbidden'),
            new ApiError(404, 'Not Found'),
            new ApiError(500, 'Internal Server Error'),
        ];

        errors.forEach((error, index) => {
            expect(error).toBeInstanceOf(ApiError);
            expect(error.statusCode).toBe([400, 401, 403, 404, 500][index]);
        });
    });
});

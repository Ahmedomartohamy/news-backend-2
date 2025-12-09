import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../../src/utils/asyncHandler';

describe('asyncHandler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    it('should call the async function and resolve successfully', async () => {
        const asyncFn = jest.fn().mockResolvedValue(undefined);
        const handler = asyncHandler(asyncFn);

        await handler(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and pass to next', async () => {
        const error = new Error('Test error');
        const asyncFn = jest.fn().mockRejectedValue(error);
        const handler = asyncHandler(asyncFn);

        await handler(mockReq as Request, mockRes as Response, mockNext);

        expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
        const error = new Error('Sync error');
        const asyncFn = jest.fn().mockImplementation(() => {
            throw error;
        });
        const handler = asyncHandler(asyncFn);

        await handler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should work with async/await functions', async () => {
        const asyncFn = async (req: Request, res: Response) => {
            res.json({ success: true });
        };
        const handler = asyncHandler(asyncFn);

        await handler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
        expect(mockNext).not.toHaveBeenCalled();
    });
});

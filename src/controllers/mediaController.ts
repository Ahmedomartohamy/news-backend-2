import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import mediaService from '../services/mediaService';
import { PaginationQuery } from '../types/requests';

/**
 * Upload single media file
 * POST /api/media/upload
 */
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
    }

    const media = await mediaService.uploadMedia(req.file, req.user.id);

    res.status(201).json({
        success: true,
        data: media,
        message: 'File uploaded successfully',
    });
});

/**
 * Upload multiple media files
 * POST /api/media/upload-multiple
 */
export const uploadMultipleMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new ApiError(400, 'No files uploaded');
    }

    const media = await mediaService.uploadMultipleMedia(req.files, req.user.id);

    res.status(201).json({
        success: true,
        data: media,
        message: `${media.length} files uploaded successfully`,
    });
});

/**
 * Get all media
 * GET /api/media
 */
export const getAllMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await mediaService.getAllMedia(query, req.user.id, req.user.role);

    res.json({
        success: true,
        data: result.media,
        pagination: result.pagination,
    });
});

/**
 * Get media by ID
 * GET /api/media/:id
 */
export const getMediaById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Media ID is required');
    }

    const id = parseInt(req.params.id);

    const media = await mediaService.getMediaById(id);

    res.json({
        success: true,
        data: media,
    });
});

/**
 * Get user's media
 * GET /api/media/my-uploads
 */
export const getMyMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await mediaService.getMediaByUser(req.user.id, query);

    res.json({
        success: true,
        data: result.media,
        pagination: result.pagination,
    });
});

/**
 * Search media
 * GET /api/media/search
 */
export const searchMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const searchQuery = req.query.q as string;

    if (!searchQuery) {
        throw new ApiError(400, 'Search query is required');
    }

    const query: PaginationQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await mediaService.searchMedia(searchQuery, query, req.user.id, req.user.role);

    res.json({
        success: true,
        data: result.media,
        pagination: result.pagination,
    });
});

/**
 * Delete media
 * DELETE /api/media/:id
 */
export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!req.params.id) {
        throw new ApiError(400, 'Media ID is required');
    }

    const id = parseInt(req.params.id);

    const result = await mediaService.deleteMedia(id, req.user.id, req.user.role);

    res.json({
        success: true,
        message: result.message,
    });
});

/**
 * Get media statistics
 * GET /api/media/stats
 */
export const getMediaStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
    }

    const stats = await mediaService.getMediaStats(req.user.id, req.user.role);

    res.json({
        success: true,
        data: stats,
    });
});
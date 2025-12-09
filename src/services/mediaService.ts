import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { uploadToR2, deleteFromR2 } from '../utils/uploadToR2';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { PaginationQuery } from '../types/requests';

export class MediaService {
  /**
   * Upload media file to R2
   */
  async uploadMedia(file: Express.Multer.File, uploadedBy: number) {
    try {
      // Upload to R2
      const result = await uploadToR2(file, 'media');

      // Save media record to database
      const media = await prisma.media.create({
        data: {
          filename: result.filename,
          originalName: file.originalname,
          r2Url: result.url,
          mimeType: result.mimeType,
          size: result.size,
          uploadedBy,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return media;
    } catch (error) {
      throw new ApiError(500, 'Failed to upload file');
    }
  }

  /**
   * Upload multiple media files
   */
  async uploadMultipleMedia(files: Express.Multer.File[], uploadedBy: number) {
    const uploadPromises = files.map((file) => this.uploadMedia(file, uploadedBy));
    const media = await Promise.all(uploadPromises);
    return media;
  }

  /**
   * Get all media with pagination
   */
  async getAllMedia(query: PaginationQuery, userId?: number, userRole?: string) {
    const { skip, take, page, limit } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: any = {};

    // Non-admin users can only see their own uploads
    if (userRole !== 'ADMIN' && userId) {
      where.uploadedBy = userId;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      media,
      pagination: getPaginationMeta(page, limit, total),
    };
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: number) {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      throw new ApiError(404, 'Media not found');
    }

    return media;
  }

  /**
   * Get media by user
   */
  async getMediaByUser(userId: number, query: PaginationQuery) {
    const { skip, take, page, limit } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: { uploadedBy: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where: { uploadedBy: userId } }),
    ]);

    return {
      media,
      pagination: getPaginationMeta(page, limit, total),
    };
  }

  /**
   * Delete media
   */
  async deleteMedia(id: number, userId: number, userRole: string) {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new ApiError(404, 'Media not found');
    }

    // Check permissions
    if (media.uploadedBy !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You can only delete your own media');
    }

    try {
      // Delete from R2
      await deleteFromR2(media.filename);

      // Delete from database
      await prisma.media.delete({
        where: { id },
      });

      return { message: 'Media deleted successfully' };
    } catch (error) {
      throw new ApiError(500, 'Failed to delete media');
    }
  }

  /**
   * Get media statistics
   */
  async getMediaStats(userId?: number, userRole?: string) {
    const where: any = {};

    // Non-admin users can only see their own stats
    if (userRole !== 'ADMIN' && userId) {
      where.uploadedBy = userId;
    }

    const [totalFiles, totalSize] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.aggregate({
        where,
        _sum: {
          size: true,
        },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      totalSizeMB: ((totalSize._sum.size || 0) / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Search media by filename or original name
   */
  async searchMedia(query: string, pagination: PaginationQuery, userId?: number, userRole?: string) {
    const { skip, take, page, limit } = getPagination({
      page: pagination.page,
      limit: pagination.limit,
    });

    const where: any = {
      OR: [
        { filename: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Non-admin users can only search their own uploads
    if (userRole !== 'ADMIN' && userId) {
      where.uploadedBy = userId;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      media,
      pagination: getPaginationMeta(page, limit, total),
    };
  }
}

export default new MediaService();
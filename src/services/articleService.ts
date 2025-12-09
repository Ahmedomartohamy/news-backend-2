import { ArticleStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { generateUniqueSlug } from '../utils/slugify';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { CreateArticleRequest, UpdateArticleRequest, ArticleFilters, PaginationQuery } from '../types/requests';

export class ArticleService {
  /**
   * Create a new article
   */
  async createArticle(data: CreateArticleRequest, authorId: number) {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.title, async (slug) => {
      const existing = await prisma.article.findUnique({ where: { slug } });
      return !!existing;
    });

    // Verify category exists
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new ApiError(404, 'Category not found');
      }
    }

    // Create article with tags
    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        authorId,
        categoryId: data.categoryId,
        status: data.status || ArticleStatus.DRAFT,
        publishedAt: data.status === ArticleStatus.PUBLISHED ? new Date() : null,
        tags: data.tagIds
          ? {
            connect: data.tagIds.map((id) => ({ id })),
          }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return article;
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string, incrementView = false) {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
        category: true,
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!article) {
      throw new ApiError(404, 'Article not found');
    }

    // Increment view count
    if (incrementView && article.status === ArticleStatus.PUBLISHED) {
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return article;
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: number) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!article) {
      throw new ApiError(404, 'Article not found');
    }

    return article;
  }

  /**
   * Get all articles with filters and pagination
   */
  async getAllArticles(filters: ArticleFilters, query: PaginationQuery) {
    const { skip, take, page, limit } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    // Build where clause
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.tagId) {
      where.tags = {
        some: {
          id: filters.tagId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    if (query.sort) {
      orderBy[query.sort] = query.order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          category: true,
          tags: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      pagination: getPaginationMeta(page, limit, total),
    };
  }

  /**
   * Update article
   */
  async updateArticle(id: number, data: UpdateArticleRequest, userId: number, userRole: string) {
    // Get existing article
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new ApiError(404, 'Article not found');
    }

    // Check permissions
    if (existingArticle.authorId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You can only edit your own articles');
    }

    // Generate new slug if title changed
    let slug = existingArticle.slug;
    if (data.title && data.title !== existingArticle.title) {
      slug = await generateUniqueSlug(data.title, async (slug) => {
        const existing = await prisma.article.findUnique({ where: { slug } });
        return !!existing && existing.id !== id;
      });
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        categoryId: data.categoryId,
        status: data.status,
        publishedAt:
          data.status === ArticleStatus.PUBLISHED && !existingArticle.publishedAt
            ? new Date()
            : existingArticle.publishedAt,
        tags: data.tagIds
          ? {
            set: data.tagIds.map((id) => ({ id })),
          }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return article;
  }

  /**
   * Publish article
   */
  async publishArticle(id: number) {
    const article = await prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    return article;
  }

  /**
   * Archive article
   */
  async archiveArticle(id: number) {
    const article = await prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.ARCHIVED },
    });

    return article;
  }

  /**
   * Delete article
   */
  async deleteArticle(id: number, userId: number, userRole: string) {
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new ApiError(404, 'Article not found');
    }

    // Check permissions
    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, 'You can only delete your own articles');
    }

    await prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
  }

  /**
   * Get related articles
   */
  async getRelatedArticles(articleId: number, limit = 5) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { tags: true },
    });

    if (!article) {
      throw new ApiError(404, 'Article not found');
    }

    const tagIds = article.tags.map((tag) => tag.id);

    const relatedArticles = await prisma.article.findMany({
      where: {
        id: { not: articleId },
        status: ArticleStatus.PUBLISHED,
        OR: [
          { categoryId: article.categoryId },
          {
            tags: {
              some: {
                id: { in: tagIds },
              },
            },
          },
        ],
      },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return relatedArticles;
  }

  /**
   * Get article statistics
   */
  async getArticleStats() {
    const [total, byStatus, totalViews] = await Promise.all([
      prisma.article.count(),
      prisma.article.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.article.aggregate({
        _sum: { viewCount: true },
      }),
    ]);

    const statusCounts = byStatus.reduce(
      (acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
        acc[item.status.toLowerCase()] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      published: statusCounts.published || 0,
      draft: statusCounts.draft || 0,
      archived: statusCounts.archived || 0,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }
}

export default new ArticleService();
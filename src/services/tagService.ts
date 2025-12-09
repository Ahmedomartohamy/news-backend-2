import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { generateUniqueSlug } from '../utils/slugify';
import { CreateTagRequest } from '../types/requests';

export class TagService {
  /**
   * Create a new tag
   */
  async createTag(data: CreateTagRequest) {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.name, async (slug) => {
      const existing = await prisma.tag.findUnique({ where: { slug } });
      return !!existing;
    });

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
      },
    });

    return tag;
  }

  /**
   * Get all tags
   */
  async getAllTags() {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags;
  }

  /**
   * Get tag by slug
   */
  async getTagBySlug(slug: string) {
    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      throw new ApiError(404, 'Tag not found');
    }

    return tag;
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: number) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      throw new ApiError(404, 'Tag not found');
    }

    return tag;
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 10) {
    const tags = await prisma.tag.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
    });

    return tags;
  }

  /**
   * Update tag
   */
  async updateTag(
    id: number,
    data: {
      name?: string;
    }
  ) {
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Tag not found');
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = await generateUniqueSlug(data.name, async (slug) => {
        const found = await prisma.tag.findUnique({ where: { slug } });
        return !!found && found.id !== id;
      });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        slug,
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    return tag;
  }

  /**
   * Delete tag
   */
  async deleteTag(id: number) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      throw new ApiError(404, 'Tag not found');
    }

    // Check if tag is used in articles
    if (tag._count.articles > 0) {
      throw new ApiError(400, `Cannot delete tag used in ${tag._count.articles} articles`);
    }

    await prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }

  /**
   * Get articles by tag
   */
  async getArticlesByTag(tagSlug: string, page = 1, limit = 10) {
    const tag = await prisma.tag.findUnique({
      where: { slug: tagSlug },
    });

    if (!tag) {
      throw new ApiError(404, 'Tag not found');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          tags: {
            some: {
              id: tag.id,
            },
          },
          status: 'PUBLISHED',
        },
        skip,
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.article.count({
        where: {
          tags: {
            some: {
              id: tag.id,
            },
          },
          status: 'PUBLISHED',
        },
      }),
    ]);

    return {
      tag,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get or create tags by names (batch)
   */
  async getOrCreateTags(tagNames: string[]) {
    const tags = [];

    for (const name of tagNames) {
      const slug = await generateUniqueSlug(name, async (slug) => {
        const existing = await prisma.tag.findUnique({ where: { slug } });
        return !!existing;
      });

      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
      });

      tags.push(tag);
    }

    return tags;
  }
}

export default new TagService();
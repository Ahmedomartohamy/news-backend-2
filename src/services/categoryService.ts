import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { generateUniqueSlug } from '../utils/slugify';
import { CreateCategoryRequest } from '../types/requests';

export class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryRequest) {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.name, async (slug) => {
      const existing = await prisma.category.findUnique({ where: { slug } });
      return !!existing;
    });

    // Check if parent exists
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new ApiError(404, 'Parent category not found');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
      },
      include: {
        parent: true,
        _count: {
          select: {
            articles: true,
            children: true,
          },
        },
      },
    });

    return category;
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return category;
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree() {
    // Get all categories
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            _count: {
              select: {
                articles: true,
              },
            },
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter only parent categories (no parentId)
    const tree = categories.filter((cat) => !cat.parentId);

    return tree;
  }

  /**
   * Update category
   */
  async updateCategory(
    id: number,
    data: {
      name?: string;
      description?: string;
      parentId?: number;
    }
  ) {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Category not found');
    }

    // Prevent circular reference
    if (data.parentId === id) {
      throw new ApiError(400, 'Category cannot be its own parent');
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = await generateUniqueSlug(data.name, async (slug) => {
        const found = await prisma.category.findUnique({ where: { slug } });
        return !!found && found.id !== id;
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Check if category has articles
    if (category._count.articles > 0) {
      throw new ApiError(400, `Cannot delete category with ${category._count.articles} articles`);
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new ApiError(
        400,
        `Cannot delete category with ${category._count.children} subcategories`
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(categorySlug: string, page = 1, limit = 10) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          categoryId: category.id,
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
          categoryId: category.id,
          status: 'PUBLISHED',
        },
      }),
    ]);

    return {
      category,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new CategoryService();
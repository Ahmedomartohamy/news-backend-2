import { UserRole, ArticleStatus, CommentStatus } from '@prisma/client';

/**
 * Mock Prisma Client for unit tests
 */
export const createMockPrismaClient = () => ({
    user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    article: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    category: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    tag: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    media: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
});

/**
 * Mock data factories
 */
export const mockUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    name: 'Test User',
    role: UserRole.AUTHOR,
    avatarUrl: null,
    bio: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

export const mockArticle = (overrides = {}) => ({
    id: 1,
    title: 'Test Article',
    slug: 'test-article',
    content: 'This is test content',
    excerpt: 'Test excerpt',
    featuredImage: null,
    authorId: 1,
    categoryId: 1,
    status: ArticleStatus.DRAFT,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

export const mockCategory = (overrides = {}) => ({
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test description',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

export const mockTag = (overrides = {}) => ({
    id: 1,
    name: 'Test Tag',
    slug: 'test-tag',
    createdAt: new Date('2024-01-01'),
    ...overrides,
});

export const mockComment = (overrides = {}) => ({
    id: 1,
    articleId: 1,
    userId: 1,
    parentId: null,
    content: 'Test comment',
    authorName: 'Test User',
    authorEmail: 'test@example.com',
    status: CommentStatus.PENDING,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

export const mockMedia = (overrides = {}) => ({
    id: 1,
    filename: 'test-file.jpg',
    originalName: 'test-file.jpg',
    r2Url: 'https://example.com/test-file.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    uploadedBy: 1,
    createdAt: new Date('2024-01-01'),
    ...overrides,
});

/**
 * Mock Prisma with specific responses
 */
export const mockPrismaResponse = (mockPrisma: any, model: string, method: string, response: any) => {
    mockPrisma[model][method].mockResolvedValue(response);
};

/**
 * Mock Prisma error
 */
export const mockPrismaError = (mockPrisma: any, model: string, method: string, error: any) => {
    mockPrisma[model][method].mockRejectedValue(error);
};

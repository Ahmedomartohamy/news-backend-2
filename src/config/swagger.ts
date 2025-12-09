import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'News API',
        version: '1.0.0',
        description: 'API documentation for the News Backend',
        license: {
            name: 'MIT',
            url: 'https://spdx.org/licenses/MIT.html',
        },
        contact: {
            name: 'API Support',
            email: 'support@example.com',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000/api',
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    name: { type: 'string', example: 'John Doe' },
                    role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'AUTHOR'], example: 'AUTHOR' },
                    bio: { type: 'string', example: 'A passionate writer' },
                    avatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
                    isActive: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Article: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    title: { type: 'string', example: 'My First Article' },
                    slug: { type: 'string', example: 'my-first-article' },
                    content: { type: 'string', example: 'Article content here...' },
                    excerpt: { type: 'string', example: 'A short summary' },
                    featuredImage: { type: 'string', format: 'uri' },
                    status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], example: 'PUBLISHED' },
                    viewCount: { type: 'integer', example: 150 },
                    publishedAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    author: { $ref: '#/components/schemas/User' },
                    category: { $ref: '#/components/schemas/Category' },
                    tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
                },
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Technology' },
                    slug: { type: 'string', example: 'technology' },
                    description: { type: 'string', example: 'Tech news and updates' },
                    parentId: { type: 'integer', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Tag: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'JavaScript' },
                    slug: { type: 'string', example: 'javascript' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Comment: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    content: { type: 'string', example: 'Great article!' },
                    status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'], example: 'APPROVED' },
                    articleId: { type: 'integer', example: 1 },
                    userId: { type: 'integer', example: 1 },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Media: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    filename: { type: 'string', example: 'image-123456.jpg' },
                    originalName: { type: 'string', example: 'photo.jpg' },
                    mimeType: { type: 'string', example: 'image/jpeg' },
                    size: { type: 'integer', example: 102400 },
                    url: { type: 'string', format: 'uri' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Operation successful' },
                },
            },
            PaginatedResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: {} },
                    pagination: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 10 },
                            total: { type: 'integer', example: 100 },
                            totalPages: { type: 'integer', example: 10 },
                        },
                    },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Error message' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', format: 'password', example: 'password123' },
                },
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            user: { $ref: '#/components/schemas/User' },
                            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        },
                    },
                    message: { type: 'string', example: 'Login successful' },
                },
            },
            UserStats: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 50 },
                    active: { type: 'integer', example: 45 },
                    inactive: { type: 'integer', example: 5 },
                    byRole: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                role: { type: 'string', example: 'AUTHOR' },
                                count: { type: 'integer', example: 30 },
                            },
                        },
                    },
                },
            },
            ArticleStats: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 100 },
                    published: { type: 'integer', example: 80 },
                    draft: { type: 'integer', example: 15 },
                    archived: { type: 'integer', example: 5 },
                    totalViews: { type: 'integer', example: 50000 },
                },
            },
        },
        responses: {
            UnauthorizedError: {
                description: 'Access token is missing or invalid',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { success: false, error: 'Not authenticated' },
                    },
                },
            },
            NotFoundError: {
                description: 'The requested resource was not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { success: false, error: 'Resource not found' },
                    },
                },
            },
            ValidationError: {
                description: 'Invalid request data',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { success: false, error: 'Validation error', details: [] },
                    },
                },
            },
        },
    },
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Articles', description: 'Article management endpoints' },
        { name: 'Categories', description: 'Category management endpoints' },
        { name: 'Tags', description: 'Tag management endpoints' },
        { name: 'Comments', description: 'Comment management endpoints' },
        { name: 'Media', description: 'Media upload endpoints' },
    ],
};

const options = {
    swaggerDefinition,
    // Paths to files containing OpenAPI definitions
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

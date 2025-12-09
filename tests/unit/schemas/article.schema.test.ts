import {
    createArticleSchema,
    updateArticleSchema,
    articleParamsSchema,
    articleSlugParamsSchema,
} from '../../../src/schemas/article.schema';

describe('Article Schemas', () => {
    describe('createArticleSchema', () => {
        it('should validate correct article data', () => {
            const validData = {
                title: 'Test Article',
                content: 'This is test content',
                excerpt: 'Test excerpt',
                featuredImage: 'https://example.com/image.jpg',
                categoryId: 1,
                tagIds: [1, 2, 3],
                status: 'DRAFT' as const,
            };

            const result = createArticleSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing title', () => {
            const invalidData = {
                content: 'This is test content',
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty title', () => {
            const invalidData = {
                title: '',
                content: 'This is test content',
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing content', () => {
            const invalidData = {
                title: 'Test Article',
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject excerpt longer than 500 characters', () => {
            const invalidData = {
                title: 'Test Article',
                content: 'This is test content',
                excerpt: 'a'.repeat(501),
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid featured image URL', () => {
            const invalidData = {
                title: 'Test Article',
                content: 'This is test content',
                featuredImage: 'not-a-url',
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid status', () => {
            const invalidData = {
                title: 'Test Article',
                content: 'This is test content',
                categoryId: 1,
                status: 'INVALID_STATUS',
            };

            const result = createArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow optional fields to be omitted', () => {
            const validData = {
                title: 'Test Article',
                content: 'This is test content',
                categoryId: 1,
            };

            const result = createArticleSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('updateArticleSchema', () => {
        it('should validate partial updates', () => {
            const validData = {
                title: 'Updated Title',
            };

            const result = updateArticleSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should allow all fields to be updated', () => {
            const validData = {
                title: 'Updated Title',
                content: 'Updated content',
                excerpt: 'Updated excerpt',
                categoryId: 2,
                tagIds: [4, 5],
                status: 'PUBLISHED' as const,
            };

            const result = updateArticleSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty title', () => {
            const invalidData = {
                title: '',
            };

            const result = updateArticleSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow empty object', () => {
            const result = updateArticleSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe('articleParamsSchema', () => {
        it('should validate numeric ID string', () => {
            const validData = { id: '123' };
            const result = articleParamsSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(123);
            }
        });

        it('should reject non-numeric ID', () => {
            const invalidData = { id: 'abc' };
            const result = articleParamsSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
        });

        it('should reject negative numbers', () => {
            const invalidData = { id: '-1' };
            const result = articleParamsSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
        });
    });

    describe('articleSlugParamsSchema', () => {
        it('should validate slug', () => {
            const validData = { slug: 'test-article-slug' };
            const result = articleSlugParamsSchema.safeParse(validData);

            expect(result.success).toBe(true);
        });

        it('should reject empty slug', () => {
            const invalidData = { slug: '' };
            const result = articleSlugParamsSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
        });
    });
});

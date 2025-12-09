import { generateSlug, generateUniqueSlug } from '../../../src/utils/slugify';

describe('Slugify Utils', () => {
    describe('generateSlug', () => {
        it('should convert text to lowercase slug', () => {
            const result = generateSlug('Hello World');
            expect(result).toBe('hello-world');
        });

        it('should remove special characters', () => {
            const result = generateSlug('Hello @#$ World!');
            expect(result).toBe('hello-dollar-world');
        });

        it('should handle multiple spaces', () => {
            const result = generateSlug('Hello    World');
            expect(result).toBe('hello-world');
        });

        it('should trim whitespace', () => {
            const result = generateSlug('  Hello World  ');
            expect(result).toBe('hello-world');
        });

        it('should handle unicode characters', () => {
            const result = generateSlug('Café au Lait');
            expect(result).toBe('cafe-au-lait');
        });

        it('should handle empty string', () => {
            const result = generateSlug('');
            expect(result).toBe('');
        });
    });

    describe('generateUniqueSlug', () => {
        it('should return original slug if not exists', async () => {
            const checkExists = jest.fn().mockResolvedValue(false);
            const result = await generateUniqueSlug('Test Article', checkExists);

            expect(result).toBe('test-article');
            expect(checkExists).toHaveBeenCalledWith('test-article');
            expect(checkExists).toHaveBeenCalledTimes(1);
        });

        it('should append counter if slug exists', async () => {
            const checkExists = jest.fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            const result = await generateUniqueSlug('Test Article', checkExists);

            expect(result).toBe('test-article-1');
            expect(checkExists).toHaveBeenCalledTimes(2);
        });

        it('should increment counter until unique slug found', async () => {
            const checkExists = jest.fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            const result = await generateUniqueSlug('Test Article', checkExists);

            expect(result).toBe('test-article-3');
            expect(checkExists).toHaveBeenCalledTimes(4);
        });

        it('should handle complex titles', async () => {
            const checkExists = jest.fn().mockResolvedValue(false);
            const result = await generateUniqueSlug('How to Build a REST API in 2024!', checkExists);

            expect(result).toBe('how-to-build-a-rest-api-in-2024');
        });
    });
});

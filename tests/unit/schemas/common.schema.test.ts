import { z } from 'zod';
import { idParamSchema, paginationSchema } from '../../../src/schemas/common.schema';

describe('Common Schema', () => {
    describe('idParamSchema', () => {
        it('should validate valid id', () => {
            const result = idParamSchema.safeParse({ id: '123' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(123); // Transformed to number
            }
        });

        it('should reject missing id', () => {
            const result = idParamSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('should reject empty id', () => {
            const result = idParamSchema.safeParse({ id: '' });
            expect(result.success).toBe(false);
        });

        it('should accept numeric string', () => {
            const result = idParamSchema.safeParse({ id: '999' });
            expect(result.success).toBe(true);
        });
    });

    describe('paginationSchema', () => {
        it('should validate with default values', () => {
            const result = paginationSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.limit).toBe(10);
            }
        });

        it('should validate custom page and limit', () => {
            const result = paginationSchema.safeParse({ page: '5', limit: '20' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(5);
                expect(result.data.limit).toBe(20);
            }
        });

        it('should accept valid sort and order', () => {
            const result = paginationSchema.safeParse({
                page: '1',
                limit: '10',
                sort: 'createdAt',
                order: 'desc',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sort).toBe('createdAt');
                expect(result.data.order).toBe('desc');
            }
        });

        it('should reject invalid order', () => {
            const result = paginationSchema.safeParse({
                order: 'invalid',
            });
            expect(result.success).toBe(false);
        });
    });
});

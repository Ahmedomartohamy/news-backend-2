import { getPagination, getPaginationMeta } from '../../../src/utils/pagination';

describe('Pagination Utils', () => {
    describe('getPagination', () => {
        it('should return correct pagination for default values', () => {
            const result = getPagination({});

            expect(result).toEqual({
                skip: 0,
                take: 10,
                page: 1,
                limit: 10,
            });
        });

        it('should calculate skip correctly for different pages', () => {
            const result = getPagination({ page: 3, limit: 10 });

            expect(result).toEqual({
                skip: 20,
                take: 10,
                page: 3,
                limit: 10,
            });
        });

        it('should handle custom limit', () => {
            const result = getPagination({ page: 1, limit: 25 });

            expect(result).toEqual({
                skip: 0,
                take: 25,
                page: 1,
                limit: 25,
            });
        });

        it('should enforce minimum page of 1', () => {
            const result = getPagination({ page: 0 });

            expect(result.page).toBe(1);
            expect(result.skip).toBe(0);
        });

        it('should enforce minimum page for negative values', () => {
            const result = getPagination({ page: -5 });

            expect(result.page).toBe(1);
            expect(result.skip).toBe(0);
        });

        it('should enforce maximum limit of 100', () => {
            const result = getPagination({ limit: 200 });

            expect(result.limit).toBe(100);
            expect(result.take).toBe(100);
        });

        it('should enforce minimum limit of 1', () => {
            const result = getPagination({ limit: 0 });

            expect(result.limit).toBe(1);
            expect(result.take).toBe(1);
        });

        it('should handle large page numbers', () => {
            const result = getPagination({ page: 100, limit: 20 });

            expect(result).toEqual({
                skip: 1980,
                take: 20,
                page: 100,
                limit: 20,
            });
        });
    });

    describe('getPaginationMeta', () => {
        it('should return correct metadata', () => {
            const result = getPaginationMeta(1, 10, 100);

            expect(result).toEqual({
                page: 1,
                limit: 10,
                total: 100,
                totalPages: 10,
            });
        });

        it('should calculate total pages correctly', () => {
            const result = getPaginationMeta(1, 10, 95);

            expect(result.totalPages).toBe(10);
        });

        it('should handle exact division', () => {
            const result = getPaginationMeta(2, 25, 100);

            expect(result.totalPages).toBe(4);
        });

        it('should handle zero total', () => {
            const result = getPaginationMeta(1, 10, 0);

            expect(result).toEqual({
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            });
        });

        it('should handle single item', () => {
            const result = getPaginationMeta(1, 10, 1);

            expect(result.totalPages).toBe(1);
        });
    });
});

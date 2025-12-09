import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
} from '../../../src/schemas/auth.schema';

describe('Auth Schemas', () => {
    describe('registerSchema', () => {
        it('should validate correct registration data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const result = registerSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
            };

            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('valid email');
            }
        });

        it('should reject short password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'short',
                name: 'Test User',
            };

            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('8 characters');
            }
        });

        it('should reject missing name', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty name', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'password123',
                name: '',
            };

            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const result = loginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'password123',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing password', () => {
            const invalidData = {
                email: 'test@example.com',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: '',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('updateProfileSchema', () => {
        it('should validate correct profile update', () => {
            const validData = {
                name: 'Updated Name',
                bio: 'Updated bio',
                avatarUrl: 'https://example.com/avatar.jpg',
            };

            const result = updateProfileSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should allow partial updates', () => {
            const validData = {
                name: 'Updated Name',
            };

            const result = updateProfileSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty name', () => {
            const invalidData = {
                name: '',
            };

            const result = updateProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject bio longer than 500 characters', () => {
            const invalidData = {
                bio: 'a'.repeat(501),
            };

            const result = updateProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('500 characters');
            }
        });

        it('should reject invalid avatar URL', () => {
            const invalidData = {
                avatarUrl: 'not-a-url',
            };

            const result = updateProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow empty object', () => {
            const result = updateProfileSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe('changePasswordSchema', () => {
        it('should validate correct password change data', () => {
            const validData = {
                oldPassword: 'oldpassword123',
                newPassword: 'newpassword123',
            };

            const result = changePasswordSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing old password', () => {
            const invalidData = {
                newPassword: 'newpassword123',
            };

            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject short new password', () => {
            const invalidData = {
                oldPassword: 'oldpassword123',
                newPassword: 'short',
            };

            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('8 characters');
            }
        });

        it('should reject empty old password', () => {
            const invalidData = {
                oldPassword: '',
                newPassword: 'newpassword123',
            };

            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});

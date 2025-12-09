import userService from '../../../src/services/userService';
import prisma from '../../../src/config/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { mockUser } from '../../helpers/prisma.mock';

// Mock dependencies
jest.mock('../../../src/config/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    },
}));

jest.mock('bcryptjs');

const mockPrisma = prisma as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('User Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            };

            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
            mockPrisma.user.create.mockResolvedValue(mockUser({ email: userData.email }));

            const result = await userService.createUser(userData);

            expect(result.email).toBe(userData.email);
            expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(mockPrisma.user.create).toHaveBeenCalled();
        });

        it('should throw error if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'User',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser());

            await expect(userService.createUser(userData)).rejects.toThrow('Email already registered');
        });

        it('should create user with custom role', async () => {
            const userData = {
                email: 'admin@example.com',
                password: 'password123',
                name: 'Admin User',
                role: UserRole.ADMIN,
            };

            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
            mockPrisma.user.create.mockResolvedValue(mockUser({ role: UserRole.ADMIN }));

            const result = await userService.createUser(userData);

            expect(mockPrisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        role: UserRole.ADMIN,
                    }),
                })
            );
        });
    });

    describe('getUserByEmail', () => {
        it('should get user by email', async () => {
            const user = mockUser({ email: 'test@example.com' });
            mockPrisma.user.findUnique.mockResolvedValue(user);

            const result = await userService.getUserByEmail('test@example.com');

            expect(result).toEqual(user);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });

        it('should return null if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await userService.getUserByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('getUserById', () => {
        it('should get user by id', async () => {
            const user = mockUser();
            mockPrisma.user.findUnique.mockResolvedValue(user);

            const result = await userService.getUserById(1);

            expect(result).toEqual(user);
        });

        it('should throw error if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(userService.getUserById(999)).rejects.toThrow('User not found');
        });
    });

    describe('getAllUsers', () => {
        it('should get all users with pagination', async () => {
            const users = [mockUser(), mockUser({ id: 2 })];
            mockPrisma.user.findMany.mockResolvedValue(users);
            mockPrisma.user.count.mockResolvedValue(2);

            const result = await userService.getAllUsers({ page: 1, limit: 10 });

            expect(result.users).toEqual(users);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
            });
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const updatedUser = mockUser({ name: 'Updated Name' });
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const result = await userService.updateUser(1, { name: 'Updated Name' });

            expect(result.name).toBe('Updated Name');
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: { name: 'Updated Name' },
                })
            );
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const user = mockUser();
            mockPrisma.user.findUnique.mockResolvedValue(user);
            mockBcrypt.compare.mockResolvedValue(true as never);
            mockBcrypt.hash.mockResolvedValue('newhashedpassword' as never);
            mockPrisma.user.update.mockResolvedValue(user);

            const result = await userService.changePassword(1, 'oldpassword', 'newpassword');

            expect(result.message).toBe('Password changed successfully');
            expect(mockBcrypt.compare).toHaveBeenCalledWith('oldpassword', user.password);
            expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
        });

        it('should throw error if old password is incorrect', async () => {
            const user = mockUser();
            mockPrisma.user.findUnique.mockResolvedValue(user);
            mockBcrypt.compare.mockResolvedValue(false as never);

            await expect(
                userService.changePassword(1, 'wrongpassword', 'newpassword')
            ).rejects.toThrow('Current password is incorrect');
        });

        it('should throw error if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                userService.changePassword(999, 'oldpassword', 'newpassword')
            ).rejects.toThrow('User not found');
        });
    });

    describe('changeUserRole', () => {
        it('should change user role successfully', async () => {
            const updatedUser = mockUser({ role: UserRole.ADMIN });
            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const result = await userService.changeUserRole(1, UserRole.ADMIN);

            expect(result.role).toBe(UserRole.ADMIN);
        });
    });

    describe('deactivateUser', () => {
        it('should deactivate user successfully', async () => {
            mockPrisma.user.update.mockResolvedValue(mockUser({ isActive: false }));

            const result = await userService.deactivateUser(1);

            expect(result.message).toBe('User deactivated successfully');
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { isActive: false },
                })
            );
        });
    });

    describe('activateUser', () => {
        it('should activate user successfully', async () => {
            mockPrisma.user.update.mockResolvedValue(mockUser({ isActive: true }));

            const result = await userService.activateUser(1);

            expect(result.message).toBe('User activated successfully');
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            mockPrisma.user.delete.mockResolvedValue(mockUser());

            const result = await userService.deleteUser(1);

            expect(result.message).toBe('User deleted successfully');
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });

    describe('verifyPassword', () => {
        it('should verify password successfully', async () => {
            mockBcrypt.compare.mockResolvedValue(true as never);

            const result = await userService.verifyPassword('password', 'hashedpassword');

            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            mockBcrypt.compare.mockResolvedValue(false as never);

            const result = await userService.verifyPassword('wrongpassword', 'hashedpassword');

            expect(result).toBe(false);
        });
    });
});

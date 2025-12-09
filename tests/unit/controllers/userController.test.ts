import { Request, Response } from 'express';
import * as userController from '../../../src/controllers/userController';
import userService from '../../../src/services/userService';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/services/userService');

const mockUserService = userService as jest.Mocked<typeof userService>;

describe('User Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should get all users with pagination', async () => {
            const users = [
                { id: 1, email: 'user1@example.com', name: 'User 1' },
                { id: 2, email: 'user2@example.com', name: 'User 2' },
            ];

            req.query = { page: '1', limit: '10' };

            mockUserService.getAllUsers.mockResolvedValue({
                users: users as any,
                pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
            });

            await userController.getAllUsers(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: users,
                pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
            });
        });
    });

    describe('getUserById', () => {
        it('should get user by id', async () => {
            const user = { id: 1, email: 'test@example.com', name: 'Test User' };
            req.params = { id: '1' };

            mockUserService.getUserById.mockResolvedValue(user as any);

            await userController.getUserById(req as Request, res as Response, next);

            expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: user,
            });
        });

        it('should throw error if id is missing', async () => {
            req.params = {};

            await userController.getUserById(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('createUser', () => {
        it('should create user successfully', async () => {
            const newUser = {
                id: 1,
                email: 'newuser@example.com',
                name: 'New User',
                role: UserRole.AUTHOR,
            };

            req.body = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
                role: UserRole.AUTHOR,
            };

            mockUserService.createUser.mockResolvedValue(newUser as any);

            await userController.createUser(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: newUser,
                message: 'User created successfully',
            });
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const updatedUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Updated Name',
            };

            req.params = { id: '1' };
            req.body = { name: 'Updated Name' };

            mockUserService.updateUser.mockResolvedValue(updatedUser as any);

            await userController.updateUser(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedUser,
                message: 'User updated successfully',
            });
        });
    });

    describe('changeUserRole', () => {
        it('should change user role successfully', async () => {
            const updatedUser = {
                id: 1,
                email: 'test@example.com',
                role: UserRole.ADMIN,
            };

            req.params = { id: '1' };
            req.body = { role: UserRole.ADMIN };

            mockUserService.changeUserRole.mockResolvedValue(updatedUser as any);

            await userController.changeUserRole(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedUser,
                message: 'User role updated successfully',
            });
        });
    });

    describe('deactivateUser', () => {
        it('should deactivate user successfully', async () => {
            req.params = { id: '1' };

            mockUserService.deactivateUser.mockResolvedValue({
                message: 'User deactivated successfully',
            });

            await userController.deactivateUser(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User deactivated successfully',
            });
        });
    });

    describe('activateUser', () => {
        it('should activate user successfully', async () => {
            req.params = { id: '1' };

            mockUserService.activateUser.mockResolvedValue({
                message: 'User activated successfully',
            });

            await userController.activateUser(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User activated successfully',
            });
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            req.params = { id: '2' };
            req.user = { id: 1, email: 'admin@example.com', role: UserRole.ADMIN };

            mockUserService.deleteUser.mockResolvedValue({
                message: 'User deleted successfully',
            });

            await userController.deleteUser(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User deleted successfully',
            });
        });

        it('should prevent deleting own account', async () => {
            req.params = { id: '1' };
            req.user = { id: 1, email: 'admin@example.com', role: UserRole.ADMIN };

            await userController.deleteUser(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});

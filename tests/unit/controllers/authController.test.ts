import { Request, Response } from 'express';
import * as authController from '../../../src/controllers/authController';
import userService from '../../../src/services/userService';
import { generateToken, generateRefreshToken } from '../../../src/config/jwt';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/services/userService');
jest.mock('../../../src/config/jwt');

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;

describe('Auth Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            mockUserService.createUser.mockResolvedValue(newUser);
            mockGenerateToken.mockReturnValue('mock-token');
            mockGenerateRefreshToken.mockReturnValue('mock-refresh-token');

            await authController.register(req as Request, res as Response, next);

            expect(mockUserService.createUser).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    user: newUser,
                    token: 'mock-token',
                    refreshToken: 'mock-refresh-token',
                },
                message: 'User registered successfully',
            });
        });

        it('should handle registration errors', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const error = new Error('Email already exists');
            mockUserService.createUser.mockRejectedValue(error);

            await authController.register(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockUserService.getUserByEmail.mockResolvedValue(user);
            mockUserService.verifyPassword.mockResolvedValue(true);
            mockGenerateToken.mockReturnValue('mock-token');
            mockGenerateRefreshToken.mockReturnValue('mock-refresh-token');

            await authController.login(req as Request, res as Response, next);

            expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
            expect(mockUserService.verifyPassword).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Login successful',
                })
            );
        });

        it('should reject login with invalid credentials', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            mockUserService.getUserByEmail.mockResolvedValue(null);

            await authController.login(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should reject login for inactive user', async () => {
            const inactiveUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                password: 'hashedpassword',
                isActive: false,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockUserService.getUserByEmail.mockResolvedValue(inactiveUser);

            await authController.login(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getCurrentUser', () => {
        it('should get current user', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.user = user;
            mockUserService.getUserById.mockResolvedValue(user);

            await authController.getCurrentUser(req as Request, res as Response, next);

            expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: user,
            });
        });

        it('should handle unauthenticated request', async () => {
            req.user = undefined;

            await authController.getCurrentUser(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('updateProfile', () => {
        it('should update user profile', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedUser = {
                ...user,
                name: 'Updated Name',
                bio: 'Updated bio',
            };

            req.user = user;
            req.body = {
                name: 'Updated Name',
                bio: 'Updated bio',
            };

            mockUserService.updateUser.mockResolvedValue(updatedUser);

            await authController.updateProfile(req as Request, res as Response, next);

            expect(mockUserService.updateUser).toHaveBeenCalledWith(1, req.body);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully',
            });
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: UserRole.AUTHOR,
                isActive: true,
                avatarUrl: null,
                bio: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.user = user;
            req.body = {
                oldPassword: 'oldpassword',
                newPassword: 'newpassword',
            };

            mockUserService.changePassword.mockResolvedValue({
                message: 'Password changed successfully',
            });

            await authController.changePassword(req as Request, res as Response, next);

            expect(mockUserService.changePassword).toHaveBeenCalledWith(1, 'oldpassword', 'newpassword');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password changed successfully',
            });
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            await authController.logout(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logged out successfully',
            });
        });
    });
});

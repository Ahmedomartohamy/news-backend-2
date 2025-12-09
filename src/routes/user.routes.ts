import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  userParamsSchema,
} from '../schemas/user.schema';

const router = Router();

// All user routes require admin authentication
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  validate(userParamsSchema, 'params'),
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  validate(createUserSchema, 'body'),
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  validate(userParamsSchema, 'params'),
  validate(updateUserSchema, 'body'),
  userController.updateUser
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin)
 */
router.patch(
  '/:id/role',
  validate(userParamsSchema, 'params'),
  validate(changeRoleSchema, 'body'),
  userController.changeUserRole
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin)
 */
router.patch(
  '/:id/deactivate',
  validate(userParamsSchema, 'params'),
  userController.deactivateUser
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin)
 */
router.patch(
  '/:id/activate',
  validate(userParamsSchema, 'params'),
  userController.activateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  validate(userParamsSchema, 'params'),
  userController.deleteUser
);

export default router;
import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from '../schemas/category.schema';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:slug', categoryController.getCategoryBySlug);
router.get('/:slug/articles', categoryController.getArticlesByCategory);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createCategorySchema, 'body'),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(categoryParamsSchema, 'params'),
  validate(updateCategorySchema, 'body'),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(categoryParamsSchema, 'params'),
  categoryController.deleteCategory
);

export default router;
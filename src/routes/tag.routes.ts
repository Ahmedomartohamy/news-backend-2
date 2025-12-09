import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireAuthor } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import {
  createTagSchema,
  updateTagSchema,
  tagParamsSchema,
} from '../schemas/tag.schema';

const router = Router();

router.get('/', tagController.getAllTags);
router.get('/popular', tagController.getPopularTags);
router.get('/:slug', tagController.getTagBySlug);
router.get('/:slug/articles', tagController.getArticlesByTag);

router.post(
  '/',
  authenticate,
  requireAuthor,
  validate(createTagSchema, 'body'),
  tagController.createTag
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(tagParamsSchema, 'params'),
  validate(updateTagSchema, 'body'),
  tagController.updateTag
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(tagParamsSchema, 'params'),
  tagController.deleteTag
);

export default router;
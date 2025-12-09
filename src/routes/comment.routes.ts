import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireEditor } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import {
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
} from '../schemas/comment.schema';

const router = Router();

router.get('/', authenticate, requireEditor, commentController.getAllComments);
router.get('/stats', authenticate, requireEditor, commentController.getCommentStats);
router.get('/:id', commentController.getCommentById);

router.post(
  '/',
  optionalAuthenticate,
  validate(createCommentSchema, 'body'),
  commentController.createComment
);

router.put(
  '/:id',
  authenticate,
  validate(commentParamsSchema, 'params'),
  validate(updateCommentSchema, 'body'),
  commentController.updateComment
);

router.delete(
  '/:id',
  authenticate,
  validate(commentParamsSchema, 'params'),
  commentController.deleteComment
);

router.patch(
  '/:id/approve',
  authenticate,
  requireEditor,
  validate(commentParamsSchema, 'params'),
  commentController.approveComment
);

router.patch(
  '/:id/reject',
  authenticate,
  requireEditor,
  validate(commentParamsSchema, 'params'),
  commentController.rejectComment
);

router.patch(
  '/:id/spam',
  authenticate,
  requireEditor,
  validate(commentParamsSchema, 'params'),
  commentController.markAsSpam
);

export default router;
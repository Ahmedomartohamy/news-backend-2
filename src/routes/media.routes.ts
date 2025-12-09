import { Router } from 'express';
import * as mediaController from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { mediaParamsSchema } from '../schemas/media.schema';

const router = Router();

router.use(authenticate); // All media routes require authentication

router.get('/', mediaController.getAllMedia);
router.get('/stats', mediaController.getMediaStats);
router.get('/search', mediaController.searchMedia);
router.get('/my-uploads', mediaController.getMyMedia);

router.get(
  '/:id',
  validate(mediaParamsSchema, 'params'),
  mediaController.getMediaById
);

router.post('/upload', uploadRateLimiter, uploadSingle, mediaController.uploadMedia);

router.post(
  '/upload-multiple',
  uploadRateLimiter,
  uploadMultiple('files', 10),
  mediaController.uploadMultipleMedia
);

router.delete(
  '/:id',
  validate(mediaParamsSchema, 'params'),
  mediaController.deleteMedia
);

export default router;
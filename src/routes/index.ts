import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import articleRoutes from './article.routes';
import categoryRoutes from './category.routes';
import tagRoutes from './tag.routes';
import commentRoutes from './comment.routes';
import mediaRoutes from './media.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/comments', commentRoutes);
router.use('/media', mediaRoutes);

export default router;
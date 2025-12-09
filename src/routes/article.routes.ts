import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAuthor } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import {
  createArticleSchema,
  updateArticleSchema,
  articleParamsSchema,
} from '../schemas/article.schema';

const router = Router();

/**
 * @route   GET /api/articles/stats
 * @desc    Get article statistics
 * @access  Public
 */
router.get('/stats', optionalAuthenticate, articleController.getArticleStats);

/**
 * @route   GET /api/articles/search
 * @desc    Search articles
 * @access  Public
 */
router.get('/search', optionalAuthenticate, articleController.searchArticles);

/**
 * @route   GET /api/articles
 * @desc    Get all articles
 * @access  Public (returns only published for non-authenticated users)
 */
router.get('/', optionalAuthenticate, articleController.getAllArticles);

/**
 * @route   GET /api/articles/:slug
 * @desc    Get article by slug
 * @access  Public (only published articles for non-authenticated users)
 */
router.get('/:slug', optionalAuthenticate, articleController.getArticleBySlug);

/**
 * @route   GET /api/articles/:id/related
 * @desc    Get related articles
 * @access  Public
 */
router.get(
  '/:id/related',
  validate(articleParamsSchema, 'params'),
  articleController.getRelatedArticles
);

/**
 * @route   POST /api/articles
 * @desc    Create new article
 * @access  Private (Author, Editor, Admin)
 */
router.post(
  '/',
  authenticate,
  requireAuthor,
  validate(createArticleSchema, 'body'),
  articleController.createArticle
);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article
 * @access  Private (Owner or Admin)
 */
router.put(
  '/:id',
  authenticate,
  requireAuthor,
  validate(articleParamsSchema, 'params'),
  validate(updateArticleSchema, 'body'),
  articleController.updateArticle
);

/**
 * @route   PATCH /api/articles/:id/publish
 * @desc    Publish article
 * @access  Private (Author, Editor, Admin)
 */
router.patch(
  '/:id/publish',
  authenticate,
  requireAuthor,
  validate(articleParamsSchema, 'params'),
  articleController.publishArticle
);

/**
 * @route   PATCH /api/articles/:id/archive
 * @desc    Archive article
 * @access  Private (Author, Editor, Admin)
 */
router.patch(
  '/:id/archive',
  authenticate,
  requireAuthor,
  validate(articleParamsSchema, 'params'),
  articleController.archiveArticle
);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete article
 * @access  Private (Owner or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  requireAuthor,
  validate(articleParamsSchema, 'params'),
  articleController.deleteArticle
);

export default router;
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import routes from './routes/index';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { requestLogger, detailedLogger } from './middleware/requestLogger';

const app: Application = express();

// Request logging middleware
app.use(requestLogger);
if (process.env.NODE_ENV === 'development') {
    app.use(detailedLogger);
}

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
if (process.env.NODE_ENV !== 'test') {
    app.use('/api', apiRateLimiter);
}

// Mount API routes
app.use('/api', routes);

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
// Root route
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'News API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            articles: '/api/articles',
            categories: '/api/categories',
            tags: '/api/tags',
            comments: '/api/comments',
            media: '/api/media',
        },
    });
});

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
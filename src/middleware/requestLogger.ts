import { Request, Response, NextFunction } from 'express';

interface LogEntry {
    timestamp: string;
    method: string;
    url: string;
    statusCode?: number;
    responseTime?: string;
    userAgent?: string;
    userId?: number;
    ip?: string;
}

const formatLogEntry = (entry: LogEntry): string => {
    const parts = [
        `[${entry.timestamp}]`,
        entry.method,
        entry.url,
        entry.statusCode ? `${entry.statusCode}` : '',
        entry.responseTime ? `${entry.responseTime}ms` : '',
        entry.userId ? `user:${entry.userId}` : '',
        entry.ip ? `ip:${entry.ip}` : '',
    ];
    return parts.filter(Boolean).join(' ');
};

/**
 * Request/Response logging middleware
 * Logs all incoming requests and their responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void): Response {
        const responseTime = Date.now() - startTime;

        const logEntry: LogEntry = {
            timestamp,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            responseTime: responseTime.toString(),
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            ip: req.ip || req.socket.remoteAddress,
        };

        // Log based on status code
        const logMessage = formatLogEntry(logEntry);

        if (res.statusCode >= 500) {
            console.error('❌', logMessage);
        } else if (res.statusCode >= 400) {
            console.warn('⚠️', logMessage);
        } else {
            console.log('✅', logMessage);
        }

        // Call original end
        if (typeof encoding === 'function') {
            return originalEnd.call(this, chunk, encoding as any);
        }
        return originalEnd.call(this, chunk, encoding as BufferEncoding, callback);
    };

    next();
};

/**
 * Development-only detailed logging
 * Logs request body and response body
 */
export const detailedLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV !== 'development') {
        return next();
    }

    console.log('\n📥 REQUEST:', {
        method: req.method,
        url: req.originalUrl,
        headers: {
            'content-type': req.get('Content-Type'),
            authorization: req.get('Authorization') ? '[PRESENT]' : '[ABSENT]',
        },
        body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
    });

    // Capture response body
    const originalSend = res.send;

    res.send = function (body: unknown): Response {
        console.log('📤 RESPONSE:', {
            statusCode: res.statusCode,
            body: typeof body === 'string' ? JSON.parse(body) : body,
        });
        return originalSend.call(this, body);
    };

    next();
};

/**
 * Simple request counter for metrics
 */
let requestCount = 0;
const requestsByEndpoint: Record<string, number> = {};

export const requestCounter = (req: Request, _res: Response, next: NextFunction): void => {
    requestCount++;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] || 0) + 1;
    next();
};

export const getRequestStats = () => ({
    totalRequests: requestCount,
    byEndpoint: requestsByEndpoint,
});

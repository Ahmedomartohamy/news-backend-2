import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation source type
 */
type ValidationSource = 'body' | 'params' | 'query';

/**
 * Zod validation middleware
 * Validates request data against a Zod schema
 */
export const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Get the data to validate based on source
            const dataToValidate = req[source];

            // Parse and validate the data
            const result = schema.safeParse(dataToValidate);

            if (!result.success) {
                // Format Zod errors into our unified error format
                const errors = result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                res.status(400).json({
                    status: 'error',
                    errors,
                });
                return;
            }

            // Replace the original data with the validated and parsed data
            // This ensures type safety and applies any transformations
            req[source] = result.data;

            next();
        } catch (error) {
            // Handle unexpected errors
            res.status(500).json({
                status: 'error',
                errors: [
                    {
                        field: 'unknown',
                        message: 'An unexpected error occurred during validation',
                    },
                ],
            });
        }
    };
};
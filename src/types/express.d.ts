import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Omit;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}
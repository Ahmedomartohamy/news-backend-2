import { User, Article, Category, Tag } from '@prisma/client';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: Omit<User, 'password'>;
        token: string;
        refreshToken?: string;
    };
}

export type UserWithoutPassword = Omit<User, 'password'>;

export interface ArticleWithRelations extends Article {
    author: UserWithoutPassword;
    category: Category | null;
    tags: Tag[];
    _count?: {
        comments: number;
    };
}
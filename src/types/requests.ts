import { ArticleStatus } from '@prisma/client';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId: number;
  tagIds?: number[];
  status?: ArticleStatus;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number;
  tagIds?: number[];
  status?: ArticleStatus;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface CreateCommentRequest {
  articleId: number;
  content: string;
  parentId?: number;
  authorName?: string;
  authorEmail?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ArticleFilters {
  status?: ArticleStatus;
  categoryId?: number;
  authorId?: number;
  tagId?: number;
  search?: string;
}
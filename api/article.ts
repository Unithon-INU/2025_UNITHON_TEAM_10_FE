import api, { ResponseWrapper } from "./api";

export interface Pageable {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface Article {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  viewCnt: number;
  content: string;
}
export interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  isAuthor: boolean;
}
export interface ArticleDetail extends Article {
  comments: Comment[];
  imageUrls: string[];
  isAuthor: boolean;
}
export interface ArticlePageable extends Pageable {
  posts: Article[];
}

export default class ArticleApi {
  static async fetchArticles({
    page,
    category,
  }: {
    page: number;
    category?: string;
  }) {
    return await api
      .get(`posts/${category ?? ""}`, {
        searchParams: { page, pageSize: 10 },
      })
      .json<ArticlePageable>();
  }

  static async fetchArticle(categoryId: string, articleId: number, isRefetch: boolean) {
    console.log(categoryId, articleId);
    return await api
      .get(`posts/${categoryId}/${articleId}?isRefetch=${isRefetch}`)
      .json<ArticleDetail>();
  }
  static async writeComment(
    categoryId: string,
    articleId: string,
    content: string
  ) {
    await api.post(`posts/${categoryId}/${articleId}/comments`, {
      json: { content },
    });
  }
}

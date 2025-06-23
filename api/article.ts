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
    return (
      await api
        .get(`posts/${category ?? ""}`, {
          searchParams: { page, pageSize: 10 },
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJja20wNzI4d2FzaEBnbWFpbC5jb20iLCJpYXQiOjE3NTA2NjMxMDMsImV4cCI6MTc1MDc0OTUwM30.nn7cRRZ1D7mr9opPri7D8uXNN3xqFyvqnvSwKT_oaOA",
          },
        })
        .json<ResponseWrapper<ArticlePageable>>()
    ).data;
  }

  static async fetchArticle(categoryId: string, articleId: number) {
    console.log(categoryId, articleId);
    return (
      await api
        .get(`posts/${categoryId}/${articleId}`, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJja20wNzI4d2FzaEBnbWFpbC5jb20iLCJpYXQiOjE3NTA2NjMxMDMsImV4cCI6MTc1MDc0OTUwM30.nn7cRRZ1D7mr9opPri7D8uXNN3xqFyvqnvSwKT_oaOA",
          },
        })
        .json<ResponseWrapper<ArticleDetail>>()
    ).data;
  }
}

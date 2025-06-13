export default class ArticleApi {
  static async fetchArticles({ page }: { page: number }) {
    return [
      {
        title: "제로웨이스트 카페 추천",
        content: "텀블러 지참하면 할인해주는 친환경 카페들을 모아봤어요!",
        author: "에코워리어",
        regDt: "2025-06-20",
        viewCnt: 400,
        commentCnt: 10,
      },
    ];
  }

  static async fetchArticle(id: string) {
    return {
      title: "제로웨이스트 카페 추천",
      content: "텀블러 지참하면 할인해주는 친환경 카페들을 모아봤어요!",
      author: "에코워리어",
      regDt: "2025-06-20",
      viewCnt: 400,
      isAuthor: true,
      comments: [
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
        {
          author: "갱갱갱",
          content: "내가 바로 갱갱갱이다",
          createdAt: "2025-07-…",
          isAuthor: true,
          authorLv: 1,
        },
      ],
    };
  }
}

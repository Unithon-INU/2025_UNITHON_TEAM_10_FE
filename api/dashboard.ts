export default class DashboardApi {
  static async fetchMyRecords() {
    return {
      totalRecycle: 123,
      badgeCount: 5,
      continiousCount: 12,
      currentScore: 430,
      recycleCounts: [
        { type: "can", count: 40 },
        { type: "paper", count: 30 },
        { type: "pet", count: 20 },
        { type: "metal", count: 15 },
      ],
      stat: [
        {
          unit: "점",
          value: 340,
        },
        {
          unit: "kg",
          value: 2.3,
          label: "이산화탄소",
        },
        {
          unit: "km",
          value: 3,
          label: "자동차",
        },
      ],
    };
  }
  static async fetchBanners() {
    return [
      {
        title: "쓰레기 버리고\n포인트 얻기",
        backgroundImage: require("../assets/images/bg.png"),
        postId: "3",
      },
    ];
  }
}

import api from "./api";

interface UserInfo {
  nickname: string;
  profileImageUrl: string;
  level: number;
  currentPoints: number;
  pointsToNextLevel: number;
}

interface Summary {
  totalRecycleCount: number;
  badgeCount: number;
  continuousDays: number;
  currentPoints: number;
}

export interface Stat {
  date: string;
  recycleCount: number;
  pointsEarned: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  iconUrl: string;
}

interface Achievements {
  earned: Achievement[];
  unearned: Achievement[];
}

interface UserData {
  userInfo: UserInfo;
  summary: Summary;
  stats: Stat[];
  trashStat: {
    plasticCount: number,
    metalCount: number,
    cardboardCount: number,
    vynylCount: number
  };
}

export default class DashboardApi {
  static async fetchMyRecords() {
    return await api.get('users/me/dashboard').json<UserData>();
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

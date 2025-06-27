import api from "./api";

export default class WasteApi {
  static async searchWasteByName(query: string) {
    return ["종이컵", "종이가방", "종이접시", "종이빨대", "종이가구"];
  }

  static async recycle(type: string, quantity: number) {
    return await api
      .post(`waste/${type}`, {
        searchParams: {
          quantity,
        },
      })
      .json<{
        currentScore: number;
        classificationResult: {
          id: string;
          name: string;
          disposalMethod: string;
          createdByAi: string;
        };
      }>();
  }
}

import api from "./api";

export type LocationInfo = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  specialWasteType: string;
};
export default class RecycleCenterApi {
  /**
   *
   * @param latitude 위도
   * @param longitude 경도
   * @param radius 반경 (km 단위)
   * @returns
   */
  static async fetchCenters(
    latitude: number,
    longitude: number,
    radius: number
  ) {
    return await api
      .get("recycling-center", {
        searchParams: {
          latitude,
          longitude,
          radius,
        },
      })
      .json<LocationInfo[]>();
  }
}

export default class WasteApi {
  static async searchWasteByName(query: string) {
    return ["종이컵", "종이가방", "종이접시", "종이빨대", "종이가구"];
  }
}

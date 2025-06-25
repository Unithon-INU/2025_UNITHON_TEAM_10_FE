import api, { ResponseWrapper } from "./api";

export default class AuthApi {
  static async checkLogin() {
    return await api
      .get("users/me/profile")
      .json<{ username: string; profileImageUrl: string }>();
  }

  /**
   *
   * @param email
   * @param password
   * @returns 사용자의 토큰을 반환합니다.
   */
  static async login(email: string, password: string) {
    return (
      await api
        .post("auth/login", {
          json: { email, password },
        })
        .json<{ token: string }>()
    ).token;
  }

  static async regsiter(email: string, password: string, nickname: string) {
    if (
      !(
        await api.post("auth/register", {
          json: { email, password, username: nickname },
        })
      ).ok
    )
      throw new Error("회원가입 실패 ");
  }

  static async logout() {
    await api.post("auth/logout");
  }
}

import ky from "ky";
// ky 설정
const api = ky.create({
  prefixUrl: process.env.EXPO_PUBLIC_API_URL,    // API 기본 주소
  timeout: 5000,             // 10초 후 타임아웃
  headers:{
    'Content-Type': "application/json"
  }
});

export interface ResponseWrapper<T> {
  status: string;
  message: string;
  data: T
}

export default api;
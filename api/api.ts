import ky from "ky";
import * as SecureStore from "expo-secure-store";
import { parseISO, isValid, format, parseJSON } from "date-fns";

const truncateMicroseconds = (value: string): string =>
  value.replace(/(\.\d{3})\d+/, "$1"); // 3자리까지 자름

const isoDateToFormattedString = (
  data: any
): any => {
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === "object" && item !== null
        ? isoDateToFormattedString(item)
        : typeof item === "string" && isValid(parseISO(truncateMicroseconds(item)))
        ? format(parseISO(truncateMicroseconds(item)), "yyyy-MM-dd HH:mm:ss")
        : item
    );
  }

  if (typeof data === "object" && data !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        const parsed = parseISO(truncateMicroseconds(value));
        if (isValid(parsed)) {
          result[key] = format(parsed, "yyyy-MM-dd HH:mm:ss");
        } else {
          result[key] = value;
        }
      } else {
        result[key] = isoDateToFormattedString(value);
      }
    }
    return result;
  }

  // 기본적으로 string/object/array 외에는 그대로 반환
  return data;
};



const api = ky.create({
  prefixUrl: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000, // 5초 후 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        console.debug("🚀 Request START:", request.method, request.url);
        if (request.method !== "GET")
          try {
            // Clone and read body for logging, then re-create request to ensure body is not consumed
            const requestBody = await request.clone().text();
            if (requestBody) {
              console.debug("📦 Request Body:", requestBody);
            }
          } catch (e) {
            if (e instanceof Error)
              console.warn(
                "📦 Could not log request body (e.g., GET requests have no body):",
                e.message
              );
          }

        // SecureStore.getItemAsync is the correct async method for Expo
        let token = null;
        try {
          token = await SecureStore.getItemAsync("token");
        } catch (error) {
          console.error("🚫 Error getting token from SecureStore:", error);
        }

        if (!token) {
          console.warn(
            "🚫 No Token Found in SecureStore! Request might fail if authorization is required."
          );
          // You might want to throw an error here to prevent the request if a token is mandatory
          // throw new Error("No Token!!!");
        } else {
          request.headers.set("Authorization", `Bearer ${token}`);
          console.debug("🔑 Authorization Header Set.");
        }
        console.debug(
          "🔗 Request Headers:",
          Object.fromEntries(request.headers.entries())
        );
        return request;
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        console.debug("✅ Response RECEIVED:", response.status, response.url);
        console.debug(
          "📄 Response Headers:",
          Object.fromEntries(response.headers.entries()),
          "📄 Request Headers:",
          Object.fromEntries(request.headers.entries())
        );
        try {
          const body = await response.clone().json();
          if (isResponseWrapper(body)) {
            const processedObject = isoDateToFormattedString(body.data);
            const bodyText = JSON.stringify(processedObject);
            console.debug("🎉 Response Body:", bodyText);
            return new Response(bodyText, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
        } catch (e) {
          if (e instanceof Error)
            console.warn("🎉 Could not log response body:", e.message);
        }
        return response;
      },
    ],
    beforeError: [
      (error) => {
        console.error(
          "❌ Request Error Caught by ky beforeError hook:",
          error.name,
          error.message
        );
        if (error.request) {
          console.error(
            "🔗 Error Request Details:",
            error.request.method,
            error.request.url
          );
          console.error(
            "🔗 Error Request Headers:",
            Object.fromEntries(error.request.headers.entries())
          );
          return error;
        }
        if (error.response) {
          console.error("📄 Error Response Status:", error.response.status);
          error.response
            .text()
            .then((text) => {
              console.error("🔥 Error Response Body:", text);
            })
            .catch((e) => {
              console.error(
                "🔥 Could not read error response body due to:",
                e.message
              );
            });
          return error;
        }
        // If it's a TypeError: Network request failed, the error.response will often be undefined.
        if (
          error.name === "TypeError" &&
          error.message === "Network request failed"
        ) {
          console.error(
            "🌐 This is likely a network issue (CORS, offline, invalid URL, DNS, etc.)."
          );
        }
        return error; // Re-throw the error to ensure it propagates
      },
    ],
  },
});

export interface ResponseWrapper<T> {
  status: string;
  message: string;
  data: T;
}

function isResponseWrapper(obj: any): obj is ResponseWrapper<any> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.status === "string" &&
    "data" in obj
  );
}

export default api;

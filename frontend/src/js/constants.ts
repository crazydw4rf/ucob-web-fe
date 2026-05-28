export const API_URL = import.meta.env.VITE_API_URL;

export const Endpoint = {
  USER_LOGIN: "/auth/login",
  USER_REGISTER: "/users",
} as const;

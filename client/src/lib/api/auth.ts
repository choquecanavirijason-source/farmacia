import apiClient, { setAuthToken, removeAuthToken, getAuthToken } from "@/config/axios";

interface LoginApiResponse {
  data: {
    access_token: string;
    expires_at: string;
    user: {
      id: number;
      name: string;
      username?: string;
      email: string;
      firstname?: string;
      lastname?: string;
      state?: string;
      roles: { id?: number; name: string }[];
    };
    permissions?: string[];
  };
}

export async function login(loginVal: string, passwordVal: string): Promise<LoginApiResponse["data"]> {
  const response = await apiClient.post<LoginApiResponse>("/auth/login", {
    login: loginVal,
    password: passwordVal,
  });

  const payload = (response.data as any)?.data ?? response.data;
  if (payload?.access_token) {
    setAuthToken(payload.access_token);
  }
  return payload;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch {
  } finally {
    removeAuthToken();
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAuthToken());
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return (response.data as any)?.data ?? response.data;
}

export { apiClient };
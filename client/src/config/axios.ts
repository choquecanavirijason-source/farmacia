import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookies';
import variables from './variables';

const apiClient = axios.create({
  baseURL: variables.api_url,
  timeout: variables.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = getCookie(variables.session.tokenName);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        deleteCookie(variables.session.tokenName, {
          path: variables.session.cookieOptions.path,
        });
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  setCookie(variables.session.tokenName, token, {
    expires: variables.session.cookieOptions.maxAge,
    path: variables.session.cookieOptions.path,
    secure: variables.session.cookieOptions.secure,
    sameSite: variables.session.cookieOptions.sameSite,
  });
};

export const removeAuthToken = () => {
  deleteCookie(variables.session.tokenName, {
    path: variables.session.cookieOptions.path,
  });
};

export const getAuthToken = (): string | null => {
  return getCookie(variables.session.tokenName);
};

export default apiClient;
import apiClient from "@/config/axios";
import type { IApiResponse } from "@/lib/types/api";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type {
  ICreateOrderPayload,
  IOrder,
  IProduct,
  IProductCategory,
} from "@/lib/types/marketplace";

export const getProducts = async (params: {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}): Promise<IPaginatedResponse<IProduct>> => {
  const res = await apiClient.get<IPaginatedResponse<IProduct>>("/marketplace/products", { params });
  return res.data;
};

export const getProduct = async (id: number): Promise<IApiResponse<IProduct>> => {
  const res = await apiClient.get<IApiResponse<IProduct>>(`/marketplace/products/${id}`);
  return res.data;
};

export const getCategories = async (): Promise<IApiResponse<IProductCategory[]>> => {
  const res = await apiClient.get<IApiResponse<IProductCategory[]>>("/marketplace/categories");
  return res.data;
};

export const createOrder = async (payload: ICreateOrderPayload): Promise<IApiResponse<IOrder>> => {
  const res = await apiClient.post<IApiResponse<IOrder>>("/marketplace/orders", payload);
  return res.data;
};

export const getMyOrders = async (params: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<IPaginatedResponse<IOrder>> => {
  const res = await apiClient.get<IPaginatedResponse<IOrder>>("/marketplace/orders", { params });
  return res.data;
};

export const getMyOrder = async (id: number): Promise<IApiResponse<IOrder>> => {
  const res = await apiClient.get<IApiResponse<IOrder>>(`/marketplace/orders/${id}`);
  return res.data;
};

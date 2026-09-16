import apiClient from "@/config/axios";
import type { IApiResponse } from "@/lib/types/api";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type { IBranchAvailability, IStaffOrder, OrderStatus } from "@/lib/types/orders";

export const getPaginated = async (params: {
  page?: number;
  per_page?: number;
  status?: string;
  branch_id?: number;
}): Promise<IPaginatedResponse<IStaffOrder>> => {
  const res = await apiClient.get<IPaginatedResponse<IStaffOrder>>("/orders", { params });
  return res.data;
};

export const getById = async (id: number): Promise<IApiResponse<IStaffOrder>> => {
  const res = await apiClient.get<IApiResponse<IStaffOrder>>(`/orders/${id}`);
  return res.data;
};

export const updateStatus = async (
  id: number,
  status: OrderStatus,
  branchId?: number
): Promise<IApiResponse<IStaffOrder>> => {
  const res = await apiClient.put<IApiResponse<IStaffOrder>>(`/orders/${id}/status`, {
    status,
    branch_id: branchId,
  });
  return res.data;
};

export const removeDetail = async (id: number, detailId: number): Promise<IApiResponse<IStaffOrder>> => {
  const res = await apiClient.delete<IApiResponse<IStaffOrder>>(`/orders/${id}/details/${detailId}`);
  return res.data;
};

export const getBranchAvailability = async (id: number): Promise<IApiResponse<IBranchAvailability[]>> => {
  const res = await apiClient.get<IApiResponse<IBranchAvailability[]>>(`/orders/${id}/branch-availability`);
  return res.data;
};

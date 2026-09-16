import apiClient from "@/config/axios";
import type { IBranch, IBranchRequest } from "@/lib/types/branch";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

let branchesPromise: Promise<IBranch[]> | null = null;

export const fetchBranches = async (forceRefresh = false): Promise<IBranch[]> => {
  if (!forceRefresh && branchesPromise) return branchesPromise;

  branchesPromise = apiClient
    .get<IPaginatedResponse<IBranch>>("/branches?per_page=100")
    .then((res) => res.data.data)
    .finally(() => {
      setTimeout(() => {
        branchesPromise = null;
      }, 1000);
    });

  return branchesPromise;
};

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IBranch>> => {
  const res = await apiClient.get<IPaginatedResponse<IBranch>>("/branches", { params, signal });
  return res.data;
};

export const create = async (input: IBranchRequest): Promise<IApiResponse<IBranch>> => {
  branchesPromise = null;
  const response = await apiClient.post<IApiResponse<IBranch>>("/branches", input);
  return response.data;
};

export const update = async (id: number, input: Partial<IBranchRequest>): Promise<IApiResponse<IBranch>> => {
  branchesPromise = null;
  const response = await apiClient.put<IApiResponse<IBranch>>(`/branches/${id}`, input);
  return response.data;
};

export const remove = async (id: number): Promise<IApiResponse<void>> => {
  branchesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>(`/branches/${id}`);
  return response.data;
};

export const bulkDestroy = async (ids: number[]): Promise<IApiResponse<void>> => {
  branchesPromise = null;
  const response = await apiClient.delete<IApiResponse<void>>("/branches", { data: { ids } });
  return response.data;
};

export const restore = async (id: number): Promise<IApiResponse<IBranch>> => {
  branchesPromise = null;
  const response = await apiClient.post<IApiResponse<IBranch>>(`/branches/${id}/restore`);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/branches/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

export const assignUsers = async (id: number, userIds: number[]): Promise<IApiResponse<IBranch>> => {
  branchesPromise = null;
  const response = await apiClient.post<IApiResponse<IBranch>>(`/branches/${id}/users`, {
    user_ids: userIds,
  });
  return response.data;
};

export const switchActiveBranch = async (branchId: number): Promise<IApiResponse<any>> => {
  const response = await apiClient.post<IApiResponse<any>>("/branches/switch-active", {
    branch_id: branchId,
  });
  return response.data;
};

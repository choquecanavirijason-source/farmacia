import apiClient from "@/config/axios";
import type { IBranchTransfer, IBranchTransferRequest } from "@/lib/types/branch-transfer";
import type { IPaginatedResponse, IPaginationRequest } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const getPaginated = async (
  params: IPaginationRequest,
  signal?: AbortSignal
): Promise<IPaginatedResponse<IBranchTransfer>> => {
  const res = await apiClient.get<IPaginatedResponse<IBranchTransfer>>("/branch-transfers", { params, signal });
  return res.data;
};

export const create = async (input: IBranchTransferRequest): Promise<IApiResponse<IBranchTransfer>> => {
  const response = await apiClient.post<IApiResponse<IBranchTransfer>>("/branch-transfers", input);
  return response.data;
};

export const exportResource = async (
  format: "excel" | "pdf",
  filters: Record<string, any> = {}
): Promise<Blob> => {
  const res = await apiClient.get<Blob>("/branch-transfers/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return res.data;
};

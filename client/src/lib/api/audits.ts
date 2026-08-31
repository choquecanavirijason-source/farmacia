import apiClient from "@/config/axios";
import type { IAudit, IAuditFilterParams } from "@/lib/types/audit";
import type { IPaginatedResponse } from "@/lib/types/pagination";
import type { IApiResponse } from "@/lib/types/api";

export const getPaginated = async (
    params: IAuditFilterParams,
    signal?: AbortSignal
): Promise<IPaginatedResponse<IAudit>> => {
    const res = await apiClient.get<IPaginatedResponse<IAudit>>("/audits", {
        params,
        signal,
    });
    return res.data;
};

export const getById = async (id: number): Promise<IApiResponse<IAudit>> => {
    const res = await apiClient.get<IApiResponse<IAudit>>(`/audits/${id}`);
    return res.data;
};

export const exportResource = async (
    format: "excel" | "pdf",
    params?: Partial<IAuditFilterParams>
): Promise<Blob> => {
    const res = await apiClient.get<Blob>("/audits/export", {
        params: { ...params, format },
        responseType: "blob",
    });
    return res.data;
};

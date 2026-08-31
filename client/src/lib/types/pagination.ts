export interface IPaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface IPaginationRequest {
    page: number;
    pageSize: number;
    search?: string;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
    filters?: Record<string, string[] | string>;
}

export interface IApiResponse<T> {
    status: number;
    success: boolean;
    message: string;
    data: T;
}

export interface IApiErrorResponse {
    error: {
        code: string;
        message: string;
    };
}

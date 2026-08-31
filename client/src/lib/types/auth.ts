export interface IAuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            roles: Array<{ name: string }>;
        };
    };
}

export interface IUser {
    id: number;
    name: string;
    email: string;
    roles: Array<{ name: string }>;
}

export interface ISesion {
    id_usuario: number;
    nombre: string;
    usuario: string;
    rol: string;
    token: string;
}

export interface IPasswordResetResponse {
    success: boolean;
    message: string;
    data: {
        message: string;
    };
}

export interface IChangePasswordResponse {
    success: boolean;
    message: string;
    data: {
        message: string;
    };
}

export interface ICurrentUserResponse {
    success: boolean;
    data: {
        user: {
            id: number;
            name: string;
            email: string;
            roles: Array<{ name: string }>;
        };
        abilities: string[];
    };
}
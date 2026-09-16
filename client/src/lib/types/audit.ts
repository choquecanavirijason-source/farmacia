export type IAuditEvent = "created" | "updated" | "deleted" | "restored" | string;

export interface IAuditUser {
    id: number;
    name: string;
    firstname?: string;
    lastname?: string;
    email: string;
}

export interface IAudit {
    id: number;
    user_type: string | null;
    user_id: number | null;
    user: IAuditUser | null;
    event: IAuditEvent;
    auditable_type: string;
    auditable_type_full?: string;
    auditable_id: number;
    subject_label?: string | null;
    branch_id?: number | null;
    branch?: { id: number; name: string | null } | null;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    url?: string;
    ip_address?: string;
    user_agent?: string;
    tags?: string;
    created_at: string;
    updated_at?: string;
}

export interface IAuditFilterParams {
    page?: number;
    pageSize?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
    period?: "all" | "today" | "week" | "month" | "custom" | string;
    date_from?: string;
    date_to?: string;
    event?: string;
    model?: string;
    branch_id?: string | number;
}

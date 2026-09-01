export type DataTableValue = string | number | boolean | Date | null | undefined;

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => DataTableValue);
  render?: (value: DataTableValue, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  width?: number;
  resizable?: boolean;
  edit?: {
    type?: "text" | "number";
    onSave: (row: T, value: string | number) => Promise<void>;
  };
}

export interface ServerFetchParams {
  page: number;
  pageSize: number;
  per_page?: number;
  search: string;
  sort: { key: string; direction: "asc" | "desc" } | null;
}

export interface ServerTableState {
  params: ServerFetchParams;
  onParamsChange: (params: ServerFetchParams) => void;
  total: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  server?: ServerTableState;
  pageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  getRowId?: (row: T) => string | number;
  getRowClassName?: (row: T) => string | undefined;
  enableSelection?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  clearSelectionKey?: unknown;
  exportFilename?: string;
  onExport?: (format: "excel" | "pdf") => void | Promise<any>;
  onRefresh?: () => void | Promise<any>;
  enableColumnDrag?: boolean;
  enableRowDrag?: boolean;
  onRowReorder?: (reorderedData: T[]) => void;
  minColumnWidth?: number;
  persistPreferences?: boolean;
  storageKey?: string;
}
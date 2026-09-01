export interface StockBajoItem {
  medicamento: any;
  stock: number;
  minStock: number;
  deficit: number;
  status: "agotado" | "critico" | "bajo" | "optimo";
}

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  preset: string;
  onPresetChange: (preset: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  isLoading?: boolean;
}

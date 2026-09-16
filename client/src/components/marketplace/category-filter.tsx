"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IProductCategory } from "@/lib/types/marketplace";

interface CategoryFilterProps {
  categories: IProductCategory[];
  activeCategoryId: number | null;
  onChange: (categoryId: number | null) => void;
}

export function CategoryFilter({ categories, activeCategoryId, onChange }: CategoryFilterProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Button
        variant={activeCategoryId === null ? "default" : "outline"}
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => onChange(null)}
      >
        Todas
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategoryId === category.id ? "default" : "outline"}
          size="sm"
          className={cn("shrink-0 rounded-full")}
          onClick={() => onChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}

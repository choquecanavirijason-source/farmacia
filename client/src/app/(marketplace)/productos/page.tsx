import { Suspense } from "react";
import { ProductDetailView } from "./product-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Skeleton className="aspect-square w-full max-w-md rounded-3xl" /></div>}>
      <ProductDetailView />
    </Suspense>
  );
}

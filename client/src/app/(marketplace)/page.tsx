import { Suspense } from "react";
import { CatalogView } from "./catalog-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceHomePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><Skeleton className="h-8 w-64" /></div>}>
      <CatalogView />
    </Suspense>
  );
}

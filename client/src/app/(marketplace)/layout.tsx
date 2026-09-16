import { Suspense } from "react";
import { CartProvider } from "@/context/cart-context";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Suspense fallback={<div className="h-16 border-b border-border" />}>
          <MarketplaceHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <MarketplaceFooter />
      </div>
    </CartProvider>
  );
}

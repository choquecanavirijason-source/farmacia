import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { MeshBackground } from "@/components/layout/mesh-background";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <MeshBackground />

      <Suspense fallback={<Skeleton className="h-105 w-full max-w-sm rounded-3xl" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

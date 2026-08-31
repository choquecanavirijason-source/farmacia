import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { MeshBackground } from "@/components/layout/mesh-background";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <MeshBackground />

      <Suspense
        fallback={
          <div className="w-full max-w-md animate-pulse">
            <div className="h-136 w-full rounded-4xl bg-muted/30" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
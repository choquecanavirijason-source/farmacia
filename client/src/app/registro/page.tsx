import { RegisterForm } from "@/app/registro/register-form";
import { MeshBackground } from "@/components/layout/mesh-background";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <MeshBackground />
      <RegisterForm />
    </div>
  );
}

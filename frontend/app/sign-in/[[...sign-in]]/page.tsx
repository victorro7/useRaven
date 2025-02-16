
// app/sign-in/[[...sign-in]]/page.tsx
import { LoginForm } from "@/app/(components)/LoginForm";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen bg-primary-black">
      <LoginForm />
    </div>
  );
}
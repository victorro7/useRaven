
// app/sign-in/[[...sign-in]]/page.tsx
import { AuthForm } from "../(components)/auth/AuthForm";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen bg-primary-black">
      <AuthForm />
    </div>
  );
}
// app/sign-up/[[...sign-up]]/page.tsx
import { SignupForm } from "@/app/(components)/SignupForm";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen bg-primary-black">
      <SignupForm />
    </div>
  );
}
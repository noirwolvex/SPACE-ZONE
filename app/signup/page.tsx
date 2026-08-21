import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Space Zone to unlock premium services, purchased books, and exclusive updates."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <SignupForm />
    </AuthShell>
  );
}

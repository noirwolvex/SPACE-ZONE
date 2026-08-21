import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a secure link to reset it."
      footerText="Remembered it?"
      footerLink="/login"
      footerLinkText="Back to login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

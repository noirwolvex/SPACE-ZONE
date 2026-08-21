import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Set a new password for your account."
      footerText="Need help?"
      footerLink="/forgot-password"
      footerLinkText="Request another link"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

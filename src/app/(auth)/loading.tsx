import { LogoSpinner } from "@/components/ui/logo-spinner";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <LogoSpinner />
    </div>
  );
}

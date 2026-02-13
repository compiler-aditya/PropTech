import { LogoSpinner } from "@/components/ui/logo-spinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LogoSpinner />
    </div>
  );
}

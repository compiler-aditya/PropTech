import { LogoSpinner } from "@/components/ui/logo-spinner";

export default function UsersLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50dvh]">
      <LogoSpinner />
    </div>
  );
}

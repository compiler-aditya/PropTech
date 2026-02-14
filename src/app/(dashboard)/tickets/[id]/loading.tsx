import { LogoSpinner } from "@/components/ui/logo-spinner";

export default function TicketLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50dvh]">
      <LogoSpinner />
    </div>
  );
}

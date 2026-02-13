import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="animate-logo-pulse rounded-xl bg-primary/10 p-4">
        <Building2 className="h-10 w-10 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}

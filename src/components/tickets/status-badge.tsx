import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusColors[status] || "")}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  COMPLETED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
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

import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  URGENT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", priorityColors[priority] || "")}
    >
      {PRIORITY_LABELS[priority] || priority}
    </Badge>
  );
}

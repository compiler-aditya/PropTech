import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
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

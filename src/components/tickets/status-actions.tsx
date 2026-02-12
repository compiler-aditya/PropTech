"use client";

import { useTransition } from "react";
import { updateTicketStatus } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { VALID_TRANSITIONS, STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Play, CheckCircle, RotateCcw, Pause } from "lucide-react";

const statusIcons: Record<string, React.ElementType> = {
  OPEN: RotateCcw,
  ASSIGNED: Pause,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle,
};

const statusButtonStyles: Record<string, string> = {
  IN_PROGRESS: "bg-orange-600 hover:bg-orange-700 text-white",
  COMPLETED: "bg-green-600 hover:bg-green-700 text-white",
  ASSIGNED: "bg-blue-600 hover:bg-blue-700 text-white",
  OPEN: "bg-gray-600 hover:bg-gray-700 text-white",
};

export function StatusActions({
  ticketId,
  currentStatus,
  userRole,
}: {
  ticketId: string;
  currentStatus: string;
  userRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  // Filter by role permissions
  const filtered = allowed.filter((s) => {
    if (userRole === "TECHNICIAN") {
      return ["IN_PROGRESS", "COMPLETED", "ASSIGNED"].includes(s);
    }
    return true;
  });

  if (filtered.length === 0) return null;

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filtered.map((status) => {
        const Icon = statusIcons[status] || Play;
        return (
          <Button
            key={status}
            size="sm"
            className={statusButtonStyles[status]}
            onClick={() => handleStatusChange(status)}
            disabled={isPending}
          >
            <Icon className="h-4 w-4 mr-1" />
            {STATUS_LABELS[status]}
          </Button>
        );
      })}
    </div>
  );
}

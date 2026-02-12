"use client";

import { useTransition } from "react";
import { updateTicketPriority } from "@/actions/tickets";
import { PRIORITY_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function PriorityActions({
  ticketId,
  currentPriority,
}: {
  ticketId: string;
  currentPriority: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(newPriority: string) {
    if (newPriority === currentPriority) return;
    startTransition(async () => {
      const result = await updateTicketPriority(ticketId, newPriority);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Priority updated to ${PRIORITY_LABELS[newPriority]}`);
      }
    });
  }

  return (
    <Select
      defaultValue={currentPriority}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[130px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

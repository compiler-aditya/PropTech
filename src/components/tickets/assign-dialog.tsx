"use client";

import { useState, useTransition } from "react";
import { assignTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Technician {
  id: string;
  name: string;
  email: string;
  _count: { assignedTickets: number };
}

export function AssignDialog({
  ticketId,
  technicians,
  currentAssigneeId,
}: {
  ticketId: string;
  technicians: Technician[];
  currentAssigneeId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAssign(technicianId: string) {
    startTransition(async () => {
      const result = await assignTicket(ticketId, technicianId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Technician assigned successfully");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          {currentAssigneeId ? "Reassign" : "Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to handle this ticket
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {technicians.map((tech) => (
            <button
              key={tech.id}
              onClick={() => handleAssign(tech.id)}
              disabled={isPending || tech.id === currentAssigneeId}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
            >
              <div>
                <p className="font-medium text-sm">{tech.name}</p>
                <p className="text-xs text-muted-foreground">{tech.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {tech._count.assignedTickets} active
                {tech.id === currentAssigneeId && " (current)"}
              </span>
            </button>
          ))}
          {technicians.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No technicians available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/lib/constants";

interface TicketFormProps {
  properties: { id: string; name: string; address: string }[];
}

export function TicketForm({ properties }: TicketFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean; ticketId?: string } | undefined,
      formData: FormData
    ) => {
      const result = await createTicket(formData);
      if (result.success && result.ticketId) {
        router.push(`/tickets/${result.ticketId}`);
      }
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide details about the issue, when it started, and any relevant context..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property</Label>
          <Select name="propertyId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number (optional)</Label>
          <Input
            id="unitNumber"
            name="unitNumber"
            placeholder="e.g., Apt 4B"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="OTHER">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="MEDIUM">
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}

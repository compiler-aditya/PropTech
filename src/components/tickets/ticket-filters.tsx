"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { X } from "lucide-react";

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tickets?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/tickets");
  }

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("search") ||
    searchParams.has("dateFrom") ||
    searchParams.has("dateTo");

  return (
    <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-row sm:gap-2 sm:flex-wrap">
      <Input
        placeholder="Search tickets..."
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => {
          const timer = setTimeout(() => updateFilter("search", e.target.value), 300);
          return () => clearTimeout(timer);
        }}
        className="sm:max-w-[200px]"
      />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
        <Select
          value={searchParams.get("status") || "ALL"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get("priority") || "ALL"}
          onValueChange={(v) => updateFilter("priority", v)}
        >
          <SelectTrigger className="sm:w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <DatePicker
          placeholder="From"
          value={searchParams.get("dateFrom") || ""}
          onChange={(v) => updateFilter("dateFrom", v)}
          className="min-w-0 flex-1 sm:flex-none sm:w-[145px]"
        />
        <span className="text-xs text-muted-foreground shrink-0">to</span>
        <DatePicker
          placeholder="To"
          value={searchParams.get("dateTo") || ""}
          onChange={(v) => updateFilter("dateTo", v)}
          className="min-w-0 flex-1 sm:flex-none sm:w-[145px]"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

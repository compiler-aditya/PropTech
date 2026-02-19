"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Property { id: string; name: string }
interface Technician { id: string; name: string }

interface AnalyticsFiltersProps {
  properties: Property[];
  technicians: Technician[];
}

export function AnalyticsFilters({ properties, technicians }: AnalyticsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const propertyId = searchParams.get("propertyId") ?? "";
  const technicianId = searchParams.get("technicianId") ?? "";

  const hasFilters = from || to || propertyId || technicianId;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/analytics?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => {
    router.push("/analytics");
  };

  return (
    <div className="space-y-2">
      {/* 2-col grid on mobile, flex row on desktop */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
        {/* Property filter */}
        <Select
          value={propertyId || "all"}
          onValueChange={(v) => updateParam("propertyId", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-full md:w-[180px] text-sm">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Technician filter */}
        <Select
          value={technicianId || "all"}
          onValueChange={(v) => updateParam("technicianId", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-full md:w-[180px] text-sm">
            <SelectValue placeholder="All Technicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technicians</SelectItem>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <DatePicker
          placeholder="From date"
          value={from}
          onChange={(v) => updateParam("from", v)}
          className="w-full md:w-[148px]"
        />
        <DatePicker
          placeholder="To date"
          value={to}
          onChange={(v) => updateParam("to", v)}
          className="w-full md:w-[148px]"
        />
      </div>

      {/* Clear all */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 gap-1 text-muted-foreground px-2">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

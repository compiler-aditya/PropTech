"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  placeholder?: string;
  value?: string; // YYYY-MM-DD string
  onChange: (value: string) => void;
  className?: string;
}

export function DatePicker({ placeholder = "Pick a date", value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  function handleSelect(date: Date | undefined) {
    if (date) {
      // Format as YYYY-MM-DD for URL params
      const formatted = format(date, "yyyy-MM-dd");
      onChange(formatted);
    } else {
      onChange("");
    }
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-9 px-3 gap-2",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-sm">
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
          {selected && (
            <span
              role="button"
              aria-label="Clear date"
              onClick={handleClear}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

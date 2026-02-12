import { timeAgo } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import {
  CirclePlus,
  ArrowRightLeft,
  UserPlus,
  AlertTriangle,
  MessageSquare,
  Paperclip,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: { name: string; role: string };
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CREATED: { icon: CirclePlus, color: "text-emerald-600", bg: "bg-emerald-50" },
  STATUS_CHANGED: { icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
  ASSIGNED: { icon: UserPlus, color: "text-violet-600", bg: "bg-violet-50" },
  PRIORITY_CHANGED: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  COMMENTED: { icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50" },
  ATTACHMENT_ADDED: { icon: Paperclip, color: "text-rose-600", bg: "bg-rose-50" },
};

const defaultConfig = { icon: CirclePlus, color: "text-gray-600", bg: "bg-gray-100" };

function getDescription(action: string, details: string | null, userName: string): string {
  const parsed = details ? JSON.parse(details) : {};
  switch (action) {
    case "CREATED":
      return `${userName} created this ticket`;
    case "STATUS_CHANGED":
      return `${userName} changed status from ${parsed.from?.replace("_", " ")} to ${parsed.to?.replace("_", " ")}`;
    case "ASSIGNED":
      return `${userName} assigned to ${parsed.technicianName}`;
    case "PRIORITY_CHANGED":
      return `${userName} changed priority from ${parsed.from} to ${parsed.to}`;
    case "COMMENTED":
      return `${userName} added a comment`;
    case "ATTACHMENT_ADDED":
      return `${userName} attached a file`;
    default:
      return `${userName} performed an action`;
  }
}

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const config = actionConfig[entry.action] || defaultConfig;
        const Icon = config.icon;
        const isLatest = index === 0;
        return (
          <div key={entry.id} className={`flex gap-3 text-sm ${isLatest ? "ring-1 ring-blue-200 rounded-lg p-2 bg-blue-50/30" : ""}`}>
            <div className="mt-0.5">
              <div className={`h-7 w-7 rounded-full ${config.bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700">
                {getDescription(entry.action, entry.details, entry.user.name)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timeAgo(entry.createdAt)} · {ROLE_LABELS[entry.user.role]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

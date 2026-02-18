import { timeAgo, formatDateTime } from "@/lib/utils";
import { ROLE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
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
  CREATED: { icon: CirclePlus, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
  STATUS_CHANGED: { icon: ArrowRightLeft, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
  ASSIGNED: { icon: UserPlus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950" },
  PRIORITY_CHANGED: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
  COMMENTED: { icon: MessageSquare, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950" },
  ATTACHMENT_ADDED: { icon: Paperclip, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950" },
};

const defaultConfig = { icon: CirclePlus, color: "text-muted-foreground", bg: "bg-muted" };

function getDescription(action: string, details: string | null, userName: string): string {
  const parsed = details ? JSON.parse(details) : {};
  switch (action) {
    case "CREATED":
      return `${userName} created this ticket`;
    case "STATUS_CHANGED":
      return `${userName} changed status from ${STATUS_LABELS[parsed.from] ?? parsed.from} to ${STATUS_LABELS[parsed.to] ?? parsed.to}`;
    case "ASSIGNED":
      return `${userName} assigned to ${parsed.technicianName}`;
    case "PRIORITY_CHANGED":
      return `${userName} changed priority from ${PRIORITY_LABELS[parsed.from] ?? parsed.from} to ${PRIORITY_LABELS[parsed.to] ?? parsed.to}`;
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
          <div key={entry.id} className={`flex gap-3 text-sm ${isLatest ? "ring-1 ring-primary/20 rounded-lg p-2 bg-primary/5" : ""}`}>
            <div className="mt-0.5">
              <div className={`h-7 w-7 rounded-full ${config.bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground/80">
                {getDescription(entry.action, entry.details, entry.user.name)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span title={formatDateTime(entry.createdAt)}>{timeAgo(entry.createdAt)}</span> · {ROLE_LABELS[entry.user.role]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

const actionIcons: Record<string, React.ElementType> = {
  CREATED: CirclePlus,
  STATUS_CHANGED: ArrowRightLeft,
  ASSIGNED: UserPlus,
  PRIORITY_CHANGED: AlertTriangle,
  COMMENTED: MessageSquare,
  ATTACHMENT_ADDED: Paperclip,
};

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
      {entries.map((entry) => {
        const Icon = actionIcons[entry.action] || CirclePlus;
        return (
          <div key={entry.id} className="flex gap-3 text-sm">
            <div className="mt-0.5">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-gray-600" />
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

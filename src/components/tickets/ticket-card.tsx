import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { Building2, MessageSquare, Paperclip, User } from "lucide-react";

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    createdAt: Date;
    property: { name: string };
    submitter: { name: string };
    assignee: { name: string } | null;
    _count: { comments: number; attachments: number };
  };
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer py-3">
        <CardContent className="px-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-2 sm:line-clamp-1">{ticket.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{ticket.property.name}</span>
              <span className="mx-1 hidden sm:inline">·</span>
              <User className="h-3 w-3 shrink-0 hidden sm:block" />
              <span className="hidden sm:inline truncate">{ticket.submitter.name}</span>
              <span className="hidden sm:inline mx-1">·</span>
              <span className="hidden sm:inline">{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:hidden">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                {ticket.submitter.name}
              </span>
              <span>·</span>
              <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <div className="flex items-center gap-2 min-w-0">
              <PriorityBadge priority={ticket.priority} />
              {ticket.assignee && (
                <span className="text-xs text-muted-foreground truncate">
                  → {ticket.assignee.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              {ticket._count.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {ticket._count.comments}
                </span>
              )}
              {ticket._count.attachments > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip className="h-3 w-3" />
                  {ticket._count.attachments}
                </span>
              )}
              <span>{timeAgo(ticket.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

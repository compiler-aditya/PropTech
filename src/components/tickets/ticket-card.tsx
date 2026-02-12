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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-1">{ticket.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {ticket.property.name}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ticket.submitter.name}
            </span>
            <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              {ticket.assignee && (
                <span className="text-xs text-muted-foreground">
                  → {ticket.assignee.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

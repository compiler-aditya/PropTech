import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getTicketById } from "@/actions/tickets";
import { getTechnicians } from "@/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { ActivityLog } from "@/components/tickets/activity-log";
import { CommentSection } from "@/components/tickets/comment-section";
import { AssignDialog } from "@/components/tickets/assign-dialog";
import { StatusActions } from "@/components/tickets/status-actions";
import { CATEGORY_LABELS, ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Building2, User, Calendar, Tag } from "lucide-react";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const ticket = await getTicketById(id);

  if (!ticket) notFound();

  let technicians: Awaited<ReturnType<typeof getTechnicians>> = [];
  if (user.role === ROLES.MANAGER) {
    technicians = await getTechnicians();
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Link
        href="/tickets"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <Badge variant="outline">
              {CATEGORY_LABELS[ticket.category] || ticket.category}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Manager: assign + status */}
          {user.role === ROLES.MANAGER && (
            <>
              <AssignDialog
                ticketId={ticket.id}
                technicians={technicians}
                currentAssigneeId={ticket.assigneeId}
              />
              <StatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
                userRole={user.role}
              />
            </>
          )}
          {/* Technician: status */}
          {user.role === ROLES.TECHNICIAN && (
            <StatusActions
              ticketId={ticket.id}
              currentStatus={ticket.status}
              userRole={user.role}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Attachments ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticket.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`/uploads/${att.storedName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/uploads/${att.storedName}`}
                        alt={att.filename}
                        className="w-full h-24 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comments ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection
                ticketId={ticket.id}
                comments={ticket.comments}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">{ticket.property.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.property.address}
                  </p>
                </div>
              </div>
              {ticket.unitNumber && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Unit</p>
                    <p className="font-medium">{ticket.unitNumber}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Submitted by</p>
                  <p className="font-medium">{ticket.submitter.name}</p>
                </div>
              </div>
              {ticket.assignee && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Assigned to</p>
                    <p className="font-medium">{ticket.assignee.name}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
              </div>
              {ticket.completedAt && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {formatDateTime(ticket.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityLog entries={ticket.activityLog} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

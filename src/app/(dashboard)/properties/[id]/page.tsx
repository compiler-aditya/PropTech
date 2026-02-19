import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getPropertyById } from "@/actions/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketCard } from "@/components/tickets/ticket-card";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Ticket,
} from "lucide-react";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["MANAGER"]);
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const totalTickets = property.tickets.length;
  const openTickets = property.tickets.filter(
    (t) => t.status !== "COMPLETED"
  ).length;
  const completedTickets = property.tickets.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Link
        href="/properties"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Properties
      </Link>

      {/* Property header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{property.name}</h1>
          <p className="text-sm text-muted-foreground">{property.address}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Ticket className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{totalTickets}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{openTickets}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{completedTickets}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details card — shown above tickets on mobile, in sidebar on desktop */}
      <div className="lg:hidden">
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Manager:</span>
              <span className="font-medium">{property.manager.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDate(property.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-base font-semibold">
            Tickets ({totalTickets})
          </h2>
          {property.tickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {property.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Ticket className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tickets for this property yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Manager</p>
                  <p className="font-medium">{property.manager.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.manager.email}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(property.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

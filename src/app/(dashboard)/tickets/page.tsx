import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getTickets } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { Plus, Ticket } from "lucide-react";
import { ROLES } from "@/lib/constants";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; search?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const { tickets, total, page, totalPages } = await getTickets({
    status: params.status,
    priority: params.priority,
    search: params.search,
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {total} ticket{total !== 1 ? "s" : ""}
          </p>
        </div>
        {user.role === ROLES.TENANT && (
          <Link href="/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <div className="mb-4">
          <TicketFilters />
        </div>
      </Suspense>

      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-900">No tickets found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {user.role === ROLES.TENANT
              ? "You haven't submitted any maintenance requests yet."
              : "No tickets match your current filters."}
          </p>
          {user.role === ROLES.TENANT && (
            <Link href="/tickets/new" className="mt-4 inline-block">
              <Button>Submit Your First Request</Button>
            </Link>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={{ query: { ...params, page: page - 1 } }}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={{ query: { ...params, page: page + 1 } }}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

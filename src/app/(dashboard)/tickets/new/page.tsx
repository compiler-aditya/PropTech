import { requireRole } from "@/lib/auth-utils";
import { getAllProperties } from "@/actions/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketForm } from "@/components/tickets/ticket-form";

export default async function NewTicketPage() {
  await requireRole(["TENANT"]);
  const properties = await getAllProperties();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Maintenance Request</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report an Issue</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <TicketForm properties={properties} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No properties available. Please contact your property manager.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

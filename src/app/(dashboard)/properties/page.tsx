"use client";

import { useEffect, useState, useTransition, useActionState } from "react";
import { getProperties, createProperty } from "@/actions/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Plus, Ticket } from "lucide-react";

type Property = {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
  _count: { tickets: number };
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProperties() {
    setLoading(true);
    const data = await getProperties();
    setProperties(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProperties();
  }, []);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | undefined, formData: FormData) => {
      const result = await createProperty(formData);
      if (result.success) {
        setOpen(false);
        loadProperties();
      }
      return result;
    },
    undefined
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-sm text-muted-foreground">
            Manage your properties
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="space-y-4 mt-2">
              {state?.error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Sunset Apartments"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St, City, State"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating..." : "Create Property"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{property.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {property.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      {property._count.tickets} ticket{property._count.tickets !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-900">No properties yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first property to get started.
          </p>
        </div>
      )}
    </div>
  );
}

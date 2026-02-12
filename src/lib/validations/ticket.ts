import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  propertyId: z.string().min(1, "Please select a property"),
  unitNumber: z.string().optional(),
  category: z.enum([
    "PLUMBING",
    "ELECTRICAL",
    "HVAC",
    "APPLIANCE",
    "STRUCTURAL",
    "PEST_CONTROL",
    "OTHER",
  ]),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional()
    .default("MEDIUM"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

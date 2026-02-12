export const ROLES = {
  TENANT: "TENANT",
  MANAGER: "MANAGER",
  TECHNICIAN: "TECHNICIAN",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const TICKET_STATUS = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TicketPriority =
  (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const MAINTENANCE_CATEGORY = {
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  HVAC: "HVAC",
  APPLIANCE: "APPLIANCE",
  STRUCTURAL: "STRUCTURAL",
  PEST_CONTROL: "PEST_CONTROL",
  OTHER: "OTHER",
} as const;

export type MaintenanceCategory =
  (typeof MAINTENANCE_CATEGORY)[keyof typeof MAINTENANCE_CATEGORY];

export const TICKET_ACTION = {
  CREATED: "CREATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ASSIGNED: "ASSIGNED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  COMMENTED: "COMMENTED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
} as const;

export const NOTIFICATION_TYPE = {
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_ASSIGNED: "TICKET_ASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
} as const;

// Display labels
export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
  APPLIANCE: "Appliance",
  STRUCTURAL: "Structural",
  PEST_CONTROL: "Pest Control",
  OTHER: "Other",
};

export const ROLE_LABELS: Record<string, string> = {
  TENANT: "Tenant",
  MANAGER: "Manager",
  TECHNICIAN: "Technician",
};

// Valid status transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN"],
  IN_PROGRESS: ["COMPLETED", "ASSIGNED"],
  COMPLETED: ["IN_PROGRESS"],
};

// Upload constraints
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_TICKET: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

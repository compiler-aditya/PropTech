export function createMockFormData(
  entries: Record<string, string>
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
}

export function createMockUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    role: string;
  }> = {}
) {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@test.com",
    role: "TENANT",
    ...overrides,
  };
}

export function createMockTicket(
  overrides: Partial<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    propertyId: string;
    submitterId: string;
    assigneeId: string | null;
    unitNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }> = {}
) {
  return {
    id: "ticket-1",
    title: "Test Ticket",
    description: "Test ticket description that is long enough",
    status: "OPEN",
    priority: "MEDIUM",
    category: "OTHER",
    propertyId: "prop-1",
    submitterId: "user-1",
    assigneeId: null,
    unitNumber: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    completedAt: null,
    ...overrides,
  };
}

// Magic byte headers for valid image files
const MAGIC_HEADERS: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46, 0x38, 0x39],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
};

export function createMockFile(
  overrides: Partial<{
    name: string;
    type: string;
    size: number;
  }> = {}
): File {
  const { name = "test.jpg", type = "image/jpeg", size = 1000 } = overrides;
  const buffer = new Uint8Array(size);
  // Write valid magic bytes for recognized image types
  const header = MAGIC_HEADERS[type];
  if (header) {
    header.forEach((byte, i) => {
      if (i < buffer.length) buffer[i] = byte;
    });
  }
  return new File([buffer], name, { type });
}

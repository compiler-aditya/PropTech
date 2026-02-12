import { vi } from "vitest";

// ---- Mock next/cache ----
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ---- Mock next/navigation ----
export class RedirectError extends Error {
  public readonly digest: string;
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.digest = `NEXT_REDIRECT;${url}`;
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

// ---- Mock @/lib/prisma ----
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  property: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  maintenanceTicket: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  ticketActivityLog: {
    create: vi.fn(),
  },
  ticketComment: {
    create: vi.fn(),
  },
  fileAttachment: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// ---- Mock @/lib/auth ----
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: {},
}));

// ---- Mock @/lib/auth-utils ----
// canAccessTicket is a pure function — use the real implementation
vi.mock("@/lib/auth-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-utils")>();
  return {
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
    getCurrentUser: vi.fn(),
    canAccessTicket: actual.canAccessTicket,
  };
});

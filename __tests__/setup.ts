import { vi } from "vitest";

// ---- Mock next/cache ----
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn(
    // unstable_cache(fn, keys, opts) returns a function that, when called,
    // just invokes the original fn (no caching in tests).
    (fn: (...args: unknown[]) => unknown) => fn
  ),
}));

// ---- Mock next/headers ----
const mockHeadersMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => mockHeadersMap.get(name) ?? null,
    has: (name: string) => mockHeadersMap.has(name),
    entries: () => mockHeadersMap.entries(),
    forEach: (cb: (value: string, key: string) => void) =>
      mockHeadersMap.forEach(cb),
  })),
}));

export { mockHeadersMap };

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
    update: vi.fn(),
  },
  property: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
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
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// ---- Mock @/lib/email ----
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: vi.fn(),
}));

// ---- Mock @/lib/auth ----
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: {},
}));

// ---- Mock @/lib/auth-utils ----
// canAccessTicket is a pure function -- use the real implementation
vi.mock("@/lib/auth-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-utils")>();
  return {
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
    getCurrentUser: vi.fn(),
    canAccessTicket: actual.canAccessTicket,
  };
});

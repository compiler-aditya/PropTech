import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { getTechnicians } from "@/actions/users";
import { createMockUser } from "../helpers";

const mockRequireRole = vi.mocked(requireRole);
const mockPrisma = vi.mocked(prisma, true);

describe("getTechnicians", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(
      createMockUser({ role: "MANAGER" })
    );
  });

  it("requires MANAGER role", async () => {
    mockPrisma.user.findMany.mockResolvedValue([] as never);

    await getTechnicians();

    expect(mockRequireRole).toHaveBeenCalledWith(["MANAGER"]);
  });

  it("returns technicians with active ticket counts", async () => {
    const mockTechnicians = [
      { id: "t1", name: "John", email: "john@test.com", _count: { assignedTickets: 2 } },
    ];
    mockPrisma.user.findMany.mockResolvedValue(mockTechnicians as never);

    const result = await getTechnicians();

    expect(result).toEqual(mockTechnicians);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "TECHNICIAN" },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      })
    );
  });

  it("orders by name ascending", async () => {
    mockPrisma.user.findMany.mockResolvedValue([] as never);

    await getTechnicians();

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });
});

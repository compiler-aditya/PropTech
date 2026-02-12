import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import {
  getProperties,
  getAllProperties,
  createProperty,
} from "@/actions/properties";
import { createMockUser, createMockFormData } from "../helpers";

const mockRequireRole = vi.mocked(requireRole);
const mockPrisma = vi.mocked(prisma, true);

describe("properties actions", () => {
  const manager = createMockUser({ id: "manager-1", role: "MANAGER" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(manager);
  });

  describe("getProperties", () => {
    it("returns properties for the manager filtered by managerId", async () => {
      const mockProps = [{ id: "p1", name: "Test Property" }];
      mockPrisma.property.findMany.mockResolvedValue(mockProps as never);

      const result = await getProperties();

      expect(result).toEqual(mockProps);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { managerId: "manager-1" },
        })
      );
    });

    it("includes ticket count", async () => {
      mockPrisma.property.findMany.mockResolvedValue([] as never);

      await getProperties();

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { tickets: true } } },
        })
      );
    });
  });

  describe("getAllProperties", () => {
    it("returns all properties without auth filter", async () => {
      const mockProps = [{ id: "p1", name: "A" }];
      mockPrisma.property.findMany.mockResolvedValue(mockProps as never);

      const result = await getAllProperties();

      expect(result).toEqual(mockProps);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });

    it("selects only id, name, address", async () => {
      mockPrisma.property.findMany.mockResolvedValue([] as never);

      await getAllProperties();

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true, address: true },
        })
      );
    });
  });

  describe("createProperty", () => {
    it("creates property with valid data", async () => {
      mockPrisma.property.create.mockResolvedValue({} as never);

      const formData = createMockFormData({
        name: "Sunset Apartments",
        address: "123 Sunset Blvd, LA, CA 90028",
      });

      const result = await createProperty(formData);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.property.create).toHaveBeenCalledWith({
        data: {
          name: "Sunset Apartments",
          address: "123 Sunset Blvd, LA, CA 90028",
          managerId: "manager-1",
        },
      });
    });

    it("rejects name shorter than 2 characters", async () => {
      const formData = createMockFormData({
        name: "A",
        address: "123 Main Street",
      });

      const result = await createProperty(formData);

      expect(result).toEqual({
        error: expect.stringContaining("2"),
      });
    });

    it("rejects address shorter than 5 characters", async () => {
      const formData = createMockFormData({
        name: "Test Building",
        address: "123",
      });

      const result = await createProperty(formData);

      expect(result).toEqual({
        error: expect.stringContaining("5"),
      });
    });

    it("accepts name exactly 2 characters", async () => {
      mockPrisma.property.create.mockResolvedValue({} as never);

      const formData = createMockFormData({
        name: "AB",
        address: "12345",
      });

      const result = await createProperty(formData);
      expect(result).toEqual({ success: true });
    });

    it("sets managerId from authenticated user", async () => {
      mockPrisma.property.create.mockResolvedValue({} as never);

      const formData = createMockFormData({
        name: "Test",
        address: "12345 Street",
      });

      await createProperty(formData);

      expect(mockPrisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ managerId: "manager-1" }),
        })
      );
    });
  });
});

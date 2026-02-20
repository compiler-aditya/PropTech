import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { requireAuth } from "@/lib/auth-utils";
import { updateAvatar, removeAvatar, getUserAvatarUrl } from "@/actions/profile";
import { revalidatePath, revalidateTag } from "next/cache";

// Mock @/lib/upload
const mockSaveFile = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock("@/lib/upload", () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
}));

const mockUser = { id: "user-1", email: "test@test.com", name: "Test User", role: "TENANT" };

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  describe("updateAvatar", () => {
    it("uploads avatar successfully", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("avatar", file);

      mockSaveFile.mockResolvedValue({ storedName: "abc-123.jpg", url: "https://blob/abc-123.jpg" });
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await updateAvatar(fd);
      expect(result).toEqual({ success: true });
      expect(mockSaveFile).toHaveBeenCalledWith(file);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { avatarUrl: "abc-123.jpg" },
      });
    });

    it("deletes old avatar when uploading new one", async () => {
      const file = new File(["data"], "new.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("avatar", file);

      mockSaveFile.mockResolvedValue({ storedName: "new-avatar.jpg", url: "https://blob/new-avatar.jpg" });
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: "old-avatar.jpg" });
      mockPrisma.user.update.mockResolvedValue({});

      await updateAvatar(fd);
      expect(mockDeleteFile).toHaveBeenCalledWith("old-avatar.jpg");
    });

    it("returns error when no file provided", async () => {
      const fd = new FormData();
      const result = await updateAvatar(fd);
      expect(result).toEqual({ error: "No file provided" });
    });

    it("returns error when file has zero size", async () => {
      const file = new File([], "empty.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("avatar", file);

      const result = await updateAvatar(fd);
      expect(result).toEqual({ error: "No file provided" });
    });

    it("returns error when saveFile throws", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("avatar", file);

      mockSaveFile.mockRejectedValue(new Error("Invalid file type"));

      const result = await updateAvatar(fd);
      expect(result).toEqual({ error: "Invalid file type" });
    });

    it("calls revalidateTag and revalidatePath", async () => {
      const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.set("avatar", file);

      mockSaveFile.mockResolvedValue({ storedName: "x.jpg", url: "https://blob/x.jpg" });
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.user.update.mockResolvedValue({});

      await updateAvatar(fd);
      expect(revalidateTag).toHaveBeenCalledWith("avatar-user-1", { expire: 0 });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("removeAvatar", () => {
    it("removes avatar successfully", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: "old.jpg" });
      mockPrisma.user.update.mockResolvedValue({});
      mockDeleteFile.mockResolvedValue(undefined);

      const result = await removeAvatar();
      expect(result).toEqual({ success: true });
      expect(mockDeleteFile).toHaveBeenCalledWith("old.jpg");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { avatarUrl: null },
      });
    });

    it("succeeds even when user has no existing avatar", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await removeAvatar();
      expect(result).toEqual({ success: true });
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it("returns error when db update fails", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

      const result = await removeAvatar();
      expect(result).toEqual({ error: "Failed to remove photo" });
    });

    it("calls revalidateTag and revalidatePath", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      mockPrisma.user.update.mockResolvedValue({});

      await removeAvatar();
      expect(revalidateTag).toHaveBeenCalledWith("avatar-user-1", { expire: 0 });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("getUserAvatarUrl", () => {
    it("returns avatar URL when user has one", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: "avatar.jpg" });

      const url = await getUserAvatarUrl("user-1");
      expect(url).toBe("avatar.jpg");
    });

    it("returns null when user has no avatar", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ avatarUrl: null });

      const url = await getUserAvatarUrl("user-1");
      expect(url).toBeNull();
    });

    it("returns null when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const url = await getUserAvatarUrl("nonexistent");
      expect(url).toBeNull();
    });
  });
});

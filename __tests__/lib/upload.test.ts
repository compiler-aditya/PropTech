import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFile } from "../helpers";

// Mock fs modules before importing the module under test
vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("test-uuid-1234"),
}));

import { saveFile, deleteFile } from "@/lib/upload";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";

describe("saveFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(existsSync).mockReturnValue(true);
  });

  it("saves a valid JPEG file", async () => {
    const file = createMockFile({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const result = await saveFile(file);

    expect(result).toEqual({
      filename: "photo.jpg",
      storedName: "test-uuid-1234.jpg",
      mimeType: "image/jpeg",
      size: 1000,
    });
    expect(writeFile).toHaveBeenCalledOnce();
  });

  it("saves a valid PNG file", async () => {
    const file = createMockFile({
      name: "image.png",
      type: "image/png",
      size: 2000,
    });

    const result = await saveFile(file);

    expect(result.storedName).toBe("test-uuid-1234.png");
    expect(result.mimeType).toBe("image/png");
  });

  it("rejects invalid file type (PDF)", async () => {
    const file = createMockFile({
      name: "doc.pdf",
      type: "application/pdf",
      size: 1000,
    });

    await expect(saveFile(file)).rejects.toThrow("Invalid file type");
  });

  it("rejects invalid file type (text)", async () => {
    const file = createMockFile({
      name: "file.txt",
      type: "text/plain",
      size: 100,
    });

    await expect(saveFile(file)).rejects.toThrow("Invalid file type");
  });

  it("rejects file exceeding 5MB", async () => {
    const file = createMockFile({
      name: "big.jpg",
      type: "image/jpeg",
      size: 5 * 1024 * 1024 + 1,
    });

    await expect(saveFile(file)).rejects.toThrow("File too large");
  });

  it("accepts file exactly at 5MB limit", async () => {
    const file = createMockFile({
      name: "exact.jpg",
      type: "image/jpeg",
      size: 5 * 1024 * 1024,
    });

    const result = await saveFile(file);
    expect(result.size).toBe(5 * 1024 * 1024);
  });

  it("creates upload directory if missing", async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const file = createMockFile();
    await saveFile(file);

    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("uploads"), {
      recursive: true,
    });
  });

  it("derives extension from MIME type, not filename", async () => {
    const file = createMockFile({
      name: "noext",
      type: "image/jpeg",
      size: 500,
    });

    const result = await saveFile(file);
    // Extension comes from MIME type map, not filename
    expect(result.storedName).toBe("test-uuid-1234.jpg");
  });

  it("rejects file with spoofed MIME type (wrong magic bytes)", async () => {
    // Create a file claiming to be JPEG but with zero bytes (no valid magic bytes)
    const buffer = new Uint8Array(100); // all zeros
    const file = new File([buffer], "fake.jpg", { type: "image/jpeg" });

    await expect(saveFile(file)).rejects.toThrow(
      "File content does not match its type"
    );
  });

  it("accepts file with valid magic bytes", async () => {
    // createMockFile now includes correct magic bytes
    const file = createMockFile({
      name: "real.png",
      type: "image/png",
      size: 500,
    });

    const result = await saveFile(file);
    expect(result.storedName).toBe("test-uuid-1234.png");
  });
});

describe("deleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes existing file", async () => {
    await deleteFile("abc.jpg");

    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining("uploads/abc.jpg")
    );
  });

  it("silently handles missing file", async () => {
    vi.mocked(unlink).mockRejectedValueOnce(new Error("ENOENT"));

    await expect(deleteFile("missing.jpg")).resolves.not.toThrow();
  });

  it("constructs correct file path", async () => {
    await deleteFile("test-file.png");

    const callArg = vi.mocked(unlink).mock.calls[0][0] as string;
    expect(callArg).toMatch(/public[/\\]uploads[/\\]test-file\.png$/);
  });
});

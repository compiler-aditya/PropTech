import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFile } from "../helpers";

// Mock @vercel/blob
vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({
    url: "https://blob.vercel-storage.com/uploads/test-uuid-1234.jpg",
  }),
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("test-uuid-1234"),
}));

import { saveFile, deleteFile } from "@/lib/upload";
import { put, del } from "@vercel/blob";

describe("saveFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/uploads/test-uuid-1234.jpg",
    } as never);
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
      storedName:
        "https://blob.vercel-storage.com/uploads/test-uuid-1234.jpg",
      mimeType: "image/jpeg",
      size: 1000,
    });
    expect(put).toHaveBeenCalledOnce();
    expect(put).toHaveBeenCalledWith(
      "uploads/test-uuid-1234.jpg",
      expect.any(Buffer),
      { access: "public", contentType: "image/jpeg" }
    );
  });

  it("saves a valid PNG file", async () => {
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/uploads/test-uuid-1234.png",
    } as never);

    const file = createMockFile({
      name: "image.png",
      type: "image/png",
      size: 2000,
    });

    const result = await saveFile(file);

    expect(result.storedName).toBe(
      "https://blob.vercel-storage.com/uploads/test-uuid-1234.png"
    );
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

  it("calls put with correct blob path and options", async () => {
    const file = createMockFile({
      name: "test.jpg",
      type: "image/jpeg",
      size: 500,
    });

    await saveFile(file);

    expect(put).toHaveBeenCalledWith(
      "uploads/test-uuid-1234.jpg",
      expect.any(Buffer),
      { access: "public", contentType: "image/jpeg" }
    );
  });

  it("derives extension from MIME type, not filename", async () => {
    const file = createMockFile({
      name: "noext",
      type: "image/jpeg",
      size: 500,
    });

    await saveFile(file);

    // The blob path should use .jpg from MIME type, not the filename
    expect(put).toHaveBeenCalledWith(
      "uploads/test-uuid-1234.jpg",
      expect.any(Buffer),
      expect.any(Object)
    );
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
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/uploads/test-uuid-1234.png",
    } as never);

    // createMockFile includes correct magic bytes
    const file = createMockFile({
      name: "real.png",
      type: "image/png",
      size: 500,
    });

    const result = await saveFile(file);
    expect(result.storedName).toBe(
      "https://blob.vercel-storage.com/uploads/test-uuid-1234.png"
    );
  });

  it("returns blob URL as storedName", async () => {
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/uploads/test-uuid-1234.jpg",
    } as never);

    const file = createMockFile({
      name: "photo.jpg",
      type: "image/jpeg",
      size: 1000,
    });

    const result = await saveFile(file);
    expect(result.storedName).toBe(
      "https://blob.vercel-storage.com/uploads/test-uuid-1234.jpg"
    );
  });
});

describe("deleteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls del with the stored name", async () => {
    await deleteFile("https://blob.vercel-storage.com/uploads/abc.jpg");

    expect(del).toHaveBeenCalledWith(
      "https://blob.vercel-storage.com/uploads/abc.jpg"
    );
  });

  it("silently handles missing file", async () => {
    vi.mocked(del).mockRejectedValueOnce(new Error("Not found"));

    await expect(
      deleteFile("https://blob.vercel-storage.com/missing.jpg")
    ).resolves.not.toThrow();
  });

  it("passes storedName directly to del", async () => {
    const storedName =
      "https://blob.vercel-storage.com/uploads/test-file.png";
    await deleteFile(storedName);

    expect(del).toHaveBeenCalledWith(storedName);
  });
});

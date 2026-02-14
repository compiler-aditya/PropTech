import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { UPLOAD } from "./constants";

// Map MIME types to safe extensions (never trust user-provided extensions)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Magic byte signatures for image validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  const matchesPrefix = signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
  if (!matchesPrefix) return false;
  // RIFF header is shared by WAV/AVI/WebP — verify "WEBP" at offset 8
  if (mimeType === "image/webp") {
    if (buffer.length < 12) return false;
    return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }
  return true;
}

export async function saveFile(file: File): Promise<{
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
}> {
  if (!UPLOAD.ALLOWED_TYPES.includes(file.type as (typeof UPLOAD.ALLOWED_TYPES)[number])) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
  }

  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate file content matches claimed MIME type
  if (!validateMagicBytes(buffer, file.type)) {
    throw new Error("File content does not match its type. Upload rejected.");
  }

  // Derive extension from validated MIME type, never from user-provided filename
  const ext = MIME_TO_EXT[file.type] || "bin";
  const storedName = `${uuidv4()}.${ext}`;

  const blob = await put(`uploads/${storedName}`, buffer, {
    access: "public",
    contentType: file.type,
  });

  return {
    filename: file.name,
    storedName: blob.url,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFile(storedName: string): Promise<void> {
  try {
    await del(storedName);
  } catch {
    // File may not exist, ignore
  }
}

import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { UPLOAD } from "./constants";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

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

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
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

  await ensureUploadDir();

  // Derive extension from validated MIME type, never from user-provided filename
  const ext = MIME_TO_EXT[file.type] || "bin";
  const storedName = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  await writeFile(filePath, buffer);

  return {
    filename: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFile(storedName: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, storedName);
  try {
    await unlink(filePath);
  } catch {
    // File may not exist, ignore
  }
}

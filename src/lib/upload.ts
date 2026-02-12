import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { UPLOAD } from "./constants";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

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

  await ensureUploadDir();

  const ext = file.name.split(".").pop() || "jpg";
  const storedName = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
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

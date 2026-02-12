import { UPLOAD } from "./constants";

export function validateUploadFile(file: File): string | null {
  if (
    !UPLOAD.ALLOWED_TYPES.includes(
      file.type as (typeof UPLOAD.ALLOWED_TYPES)[number]
    )
  ) {
    return `${file.name}: Invalid file type`;
  }
  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    return `${file.name}: File too large (max 5MB)`;
  }
  return null;
}

"use client";

import { useState, useTransition, useRef } from "react";
import { uploadFiles } from "@/actions/uploads";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { validateUploadFile } from "@/lib/upload-validation";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function ImageUpload({ ticketId }: { ticketId: string }) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((file) => {
      const error = validateUploadFile(file);
      if (error) {
        toast.error(error);
        return false;
      }
      return true;
    });

    const newPreviews = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleUpload() {
    if (previews.length === 0) return;
    startTransition(async () => {
      const formData = new FormData();
      previews.forEach((p) => formData.append("files", p.file));
      const result = await uploadFiles(ticketId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} file(s) uploaded`);
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Click to upload images
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WebP, GIF up to 5MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePreview(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {formatFileSize(preview.file.size)}
                </p>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-1" />
            {isPending ? "Uploading..." : `Upload ${previews.length} file(s)`}
          </Button>
        </>
      )}
    </div>
  );
}

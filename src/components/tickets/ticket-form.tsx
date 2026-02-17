"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/actions/tickets";
import { uploadFiles } from "@/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS, UPLOAD } from "@/lib/constants";
import { formatFileSize } from "@/lib/utils";
import { validateUploadFile } from "@/lib/upload-validation";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface TicketFormProps {
  properties: { id: string; name: string; address: string }[];
}

export function TicketForm({ properties }: TicketFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; url: string }[]
  >([]);
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

    setSelectedFiles((prev) => {
      const total = prev.length + valid.length;
      if (total > UPLOAD.MAX_FILES_PER_TICKET) {
        toast.error(`Maximum ${UPLOAD.MAX_FILES_PER_TICKET} images allowed`);
        const allowed = valid.slice(0, UPLOAD.MAX_FILES_PER_TICKET - prev.length);
        return [
          ...prev,
          ...allowed.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ];
      }
      return [
        ...prev,
        ...valid.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ];
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsPending(true);

    try {
      const result = await createTicket(formData);

      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }

      if (result.success && result.ticketId) {
        // Upload images if any were selected
        if (selectedFiles.length > 0) {
          const uploadFormData = new FormData();
          selectedFiles.forEach((sf) => uploadFormData.append("files", sf.file));
          const uploadResult = await uploadFiles(result.ticketId, uploadFormData);
          if (uploadResult.error) {
            toast.error(`Ticket created but image upload failed: ${uploadResult.error}`);
          } else {
            toast.success(
              `${uploadResult.count} image(s) uploaded`
            );
          }
          selectedFiles.forEach((sf) => URL.revokeObjectURL(sf.url));
        }

        router.push(`/tickets/${result.ticketId}`);
      }
    } catch {
      setError("An unexpected error occurred");
      setIsPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide details about the issue, when it started, and any relevant context..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property</Label>
          <Select name="propertyId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number (optional)</Label>
          <Input
            id="unitNumber"
            name="unitNumber"
            placeholder="e.g., Apt 4B"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="OTHER">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="MEDIUM">
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label>Images (optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to add images of the issue
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP, GIF up to 5MB each (max{" "}
            {UPLOAD.MAX_FILES_PER_TICKET})
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

        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {selectedFiles.map((sf, idx) => (
              <div key={idx} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sf.url}
                  alt={sf.file.name}
                  className="w-full h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {formatFileSize(sf.file.size)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? selectedFiles.length > 0
            ? "Submitting & Uploading..."
            : "Submitting..."
          : "Submit Request"}
      </Button>
    </form>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { updateAvatar, removeAvatar } from "@/actions/profile";
import { validateUploadFile } from "@/lib/upload-validation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userName: string;
}

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayUrl = preview || currentAvatarUrl;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateUploadFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleUpload() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    startTransition(async () => {
      const result = await updateAvatar(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile photo updated");
        setSelectedFile(null);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile photo removed");
        setSelectedFile(null);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      }
    });
  }

  function handleCancel() {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24">
          {displayUrl && <AvatarImage src={displayUrl} alt={userName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleUpload} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : null}
            {isPending ? "Uploading..." : "Save Photo"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            <Camera className="h-4 w-4 mr-1.5" />
            {currentAvatarUrl ? "Change Photo" : "Upload Photo"}
          </Button>
          {currentAvatarUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1.5" />
              )}
              Remove
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
    </div>
  );
}

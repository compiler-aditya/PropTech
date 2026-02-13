"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {error.message === "fetch failed" || error.message.includes("network")
          ? "Unable to connect. Please check your internet connection."
          : "An error occurred. Please try again."}
      </p>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-1.5" />
        Try Again
      </Button>
    </div>
  );
}

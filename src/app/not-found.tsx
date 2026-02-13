import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-lg font-medium mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

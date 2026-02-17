"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      return await registerAction(formData);
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
          {state.error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          required
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="TENANT">
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TENANT">Tenant</SelectItem>
            <SelectItem value="MANAGER">Property Manager</SelectItem>
            <SelectItem value="TECHNICIAN">Technician</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}

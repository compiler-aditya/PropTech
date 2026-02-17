"use client";

import { useTransition } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Home, Shield, Wrench } from "lucide-react";

const demoAccounts = [
  {
    label: "Tenant",
    email: "sarah@demo.com",
    icon: Home,
    description: "Submit & track requests",
    color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  },
  {
    label: "Manager",
    email: "admin@demo.com",
    icon: Shield,
    description: "Assign & manage tickets",
    color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
  },
  {
    label: "Technician",
    email: "john@demo.com",
    icon: Wrench,
    description: "View & resolve tasks",
    color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800",
  },
];

export function DemoLogin() {
  const [isPending, startTransition] = useTransition();

  function handleDemoLogin(email: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", "password123");
      await loginAction(formData);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-center text-muted-foreground">
        Quick demo access
      </p>
      <div className="grid gap-2">
        {demoAccounts.map((account) => (
          <Button
            key={account.email}
            variant="outline"
            className={`w-full justify-start gap-3 h-auto py-3 ${account.color}`}
            onClick={() => handleDemoLogin(account.email)}
            disabled={isPending}
          >
            <account.icon className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Login as {account.label}</div>
              <div className="text-xs opacity-70">{account.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

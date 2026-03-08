import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  ChartColumnIncreasing,
  CheckCircle2,
  Clock3,
  MapPinned,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureHighlights = [
  {
    icon: BellRing,
    title: "Real-time updates",
    description: "Keep tenants, managers, and technicians aligned with live notifications and status changes.",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Operational clarity",
    description: "Track workload, bottlenecks, and maintenance trends from one manager-friendly dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description: "Each user sees the right actions, data, and workflow states for their responsibilities.",
  },
  {
    icon: MessageSquareMore,
    title: "Complete context",
    description: "Comments, attachments, and activity logs stay attached to each ticket from intake to resolution.",
  },
];

const roleCards = [
  {
    icon: Building2,
    title: "For tenants",
    description: "Report issues fast, attach photos, and follow progress without calling the office.",
  },
  {
    icon: Users,
    title: "For managers",
    description: "Assign work, monitor properties, and make faster decisions with better visibility.",
  },
  {
    icon: Wrench,
    title: "For technicians",
    description: "See assigned jobs clearly, update progress in the field, and close work with confidence.",
  },
];

const workflowSteps = [
  {
    label: "01",
    title: "Capture the issue",
    description: "Tenants submit maintenance requests with category, priority, and image uploads.",
  },
  {
    label: "02",
    title: "Coordinate the response",
    description: "Managers triage, assign, and track every task from a single operational view.",
  },
  {
    label: "03",
    title: "Close the loop",
    description: "Technicians update status, add notes, and complete work with a visible audit trail.",
  },
];

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.05),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.24),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.35)_48%,transparent)]" />
      <div className="absolute left-[-8rem] top-40 -z-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur">
            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              PropTech
            </p>
            <p className="text-sm font-medium">Maintenance operations</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-24 lg:pt-10">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-500/30 bg-emerald-500/8 px-4 py-1 text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-300"
          >
            Built for modern property operations
          </Badge>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Resolve maintenance faster without losing the human context.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            PropTech gives tenants a simple way to report issues, managers a calm control
            center to coordinate work, and technicians a clear path to resolution.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
            >
              <Link href="/login">
                Explore the workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/register">Start with a new account</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Demo accounts are available on the sign-in page for tenant, manager, and technician flows.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl border-border/60 bg-background/70 py-0 shadow-sm backdrop-blur">
              <CardContent className="p-5">
                <p className="text-2xl font-semibold">3 roles</p>
                <p className="mt-1 text-sm text-muted-foreground">Tenant, manager, and technician workflows.</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/60 bg-background/70 py-0 shadow-sm backdrop-blur">
              <CardContent className="p-5">
                <p className="text-2xl font-semibold">1 workflow</p>
                <p className="mt-1 text-sm text-muted-foreground">From intake to completion with activity tracking.</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/60 bg-background/70 py-0 shadow-sm backdrop-blur">
              <CardContent className="p-5">
                <p className="text-2xl font-semibold">Live visibility</p>
                <p className="mt-1 text-sm text-muted-foreground">Notifications, analytics, and role-aware access.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-500/15 via-transparent to-sky-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-background/85 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur dark:bg-slate-950/75">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Daily control center
                </p>
                <h2 className="mt-1 text-xl font-semibold">Keep every ticket moving</h2>
              </div>
              <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Response-ready
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <Card className="rounded-[1.5rem] border-border/60 bg-gradient-to-br from-background via-background to-emerald-500/5 py-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency plumbing leak</p>
                      <p className="mt-2 text-lg font-semibold">Unit 4B · North Tower</p>
                    </div>
                    <Badge className="rounded-full bg-amber-500 text-amber-950 hover:bg-amber-500">
                      High priority
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Submitted by tenant</span>
                        <span className="text-muted-foreground">8:10 AM</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Photo attached with leak spreading into hallway ceiling.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Assigned to technician</span>
                        <span className="text-muted-foreground">8:17 AM</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Manager escalated the priority and alerted the onsite team.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Resolution in progress</span>
                        <span className="text-emerald-700 dark:text-emerald-300">ETA 22 min</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Occupants and managers stay updated without repeated calls or handoffs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <Card className="rounded-[1.5rem] border-border/60 py-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-500/12 p-2 text-sky-700 dark:text-sky-300">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Median assignment time</p>
                        <p className="text-2xl font-semibold">11 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/60 py-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-500/12 p-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tracked completion states</p>
                        <p className="text-2xl font-semibold">Open to closed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-[1.5rem] border-border/60 py-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500/12 p-2 text-amber-700 dark:text-amber-300">
                        <MapPinned className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Property oversight</p>
                        <p className="text-2xl font-semibold">Per-building visibility</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureHighlights.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="rounded-[1.75rem] border-border/60 bg-background/75 py-0 shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="max-w-lg">
          <Badge variant="outline" className="rounded-full px-4 py-1">
            Role-specific by design
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            One platform, three focused experiences.
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            The product is structured around how maintenance work actually happens, not around a generic checklist.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roleCards.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="rounded-[1.75rem] border-border/60 bg-gradient-to-b from-background to-muted/30 py-0"
            >
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl shadow-slate-950/20">
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-14">
            <div>
              <Badge className="rounded-full bg-white/10 px-4 py-1 text-white hover:bg-white/10">
                Workflow
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                A clearer path from request to resolution.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                Every update stays visible, every handoff stays accountable, and every team knows what happens next.
              </p>
            </div>

            <div className="grid gap-4">
              {workflowSteps.map((step) => (
                <div
                  key={step.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-200">
                      {step.label}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <Card className="rounded-[2rem] border-border/60 bg-background/85 py-0 shadow-lg shadow-slate-950/5 backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Start with a better front door for maintenance operations.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Sign in with a demo account to explore the workflow, or create an account and start managing requests from day one.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
              >
                <Link href="/login">Go to sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

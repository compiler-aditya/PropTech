# PropTech - Property Maintenance Management System

A full-stack web application for managing property maintenance requests. Tenants report issues, managers assign and track work, and technicians resolve tasks efficiently.

## Features

### Core
- **Role-Based Access**: Tenant, Property Manager, and Technician roles with enforced permissions via middleware
- **Ticket Workflow**: Open → Assigned → In Progress → Completed with role-specific transition rules
- **Activity Log**: Complete audit trail per ticket (created, assigned, status changes, comments)
- **Comments**: Threaded comments with participant notifications
- **File Uploads**: Image attachments on tickets via Vercel Blob (JPEG, PNG, WebP, GIF up to 5MB, camera capture supported)
- **In-App Notifications**: Real-time notification bell with unread count, All/Unread/Read filtering

### Manager Tools
- **Property Management**: Add and manage properties, view per-property ticket breakdowns
- **User Directory**: View all users with avatar initials, role badges, and ticket counts
- **Analytics Dashboard**: Interactive charts (status distribution, priority breakdown, monthly trends, category analysis, technician workload) with property/technician/date filters and CSV/Excel/PDF export
- **Ticket Assignment**: Assign technicians, change priority, manage status from ticket detail

### UI/UX
- **Responsive Design**: Mobile-first with bottom nav + hamburger drawer on mobile, sidebar on desktop
- **Dark Mode**: System-aware theme toggle with consistent dark mode across all pages
- **Desktop Polish**: Breadcrumb navigation, notification badges in sidebar, enterprise-grade table layouts
- **Profile**: Avatar upload with photo management
- **Demo Quick-Login**: One-click login for each role on the login page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma v6 ORM |
| Auth | NextAuth.js v5 (JWT + Credentials) |
| UI | shadcn/ui + TailwindCSS v4 |
| Charts | Recharts (via shadcn chart wrapper) |
| Validation | Zod v4 |
| File Storage | Vercel Blob |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use the included Docker setup)

### Setup

```bash
# Clone the repository
git clone https://github.com/compiler-aditya/PropTech.git
cd PropTech

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Demo Accounts

All passwords: `password123`

| Role | Email | What You Can Do |
|------|-------|----------------|
| Tenant | sarah@demo.com | Submit requests, track your tickets, add comments |
| Tenant | mike@demo.com | Submit requests, track your tickets |
| Manager | admin@demo.com | View all tickets, assign technicians, manage properties, analytics |
| Technician | john@demo.com | View assigned tasks, start/complete work, add comments |
| Technician | lisa@demo.com | View assigned tasks, update status |

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, Register (public)
│   ├── (dashboard)/        # Protected pages
│   │   ├── dashboard/      # Role-specific dashboard with stat cards + recent tickets
│   │   ├── tickets/        # Ticket list, detail, and new ticket form
│   │   ├── properties/     # Property list and detail (Manager)
│   │   ├── users/          # User directory (Manager)
│   │   ├── analytics/      # Charts and metrics (Manager)
│   │   ├── notifications/  # Notification center with tabs
│   │   └── profile/        # User profile with avatar upload
│   └── api/
│       ├── auth/           # NextAuth API handler
│       └── files/          # File download endpoint
├── actions/                # Server Actions
│   ├── tickets.ts          # CRUD, status transitions, dashboard stats
│   ├── properties.ts       # Property management
│   ├── notifications.ts    # Mark read, get notifications
│   ├── analytics.ts        # Aggregated analytics data
│   ├── users.ts            # User listing, technician lookup
│   ├── comments.ts         # Add comments
│   ├── uploads.ts          # File upload to Vercel Blob
│   ├── profile.ts          # Avatar management
│   └── auth.ts             # Login, register, logout
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # App shell, sidebar, mobile nav, header (breadcrumbs)
│   ├── tickets/            # Ticket card, form, filters, status/priority actions, activity log
│   ├── analytics/          # Chart components (donut, bar, line, trend) + filters + export
│   ├── notifications/      # Notification list with tabs
│   ├── profile/            # Avatar upload component
│   ├── uploads/            # Image upload with camera capture
│   └── auth/               # Login form, demo login, register form
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── auth.config.ts      # Edge-compatible auth config
│   ├── auth-utils.ts       # requireAuth, requireRole helpers
│   ├── prisma.ts           # Prisma client singleton
│   ├── constants.ts        # Roles, categories, status labels
│   ├── utils.ts            # Date formatting, timeAgo, cn utility
│   └── validations/        # Zod schemas
└── middleware.ts            # Route protection + role-based access control
```

## Architecture Decisions

- **Server Actions over API routes** for type-safe mutations without a separate API layer
- **JWT sessions** (required for CredentialsProvider) with role injection in callbacks
- **Edge-compatible middleware** using separate `auth.config.ts` (no Prisma in edge runtime)
- **PostgreSQL** for production-ready relational storage with Prisma ORM
- **Vercel Blob** for file storage (production-ready, no local filesystem dependency)
- **Activity log as separate table** for reliable audit trails without event sourcing complexity
- **Zod validation** at server action boundaries for runtime type safety
- **Recharts via shadcn chart wrapper** for consistent chart styling with theme support

## Testing

246 tests across 15 test files using **Vitest**.

```bash
# Run all tests
npm test

# Run with coverage
npx vitest run --coverage
```

| Test File | Tests | What's Covered |
|-----------|-------|---------------|
| `actions/tickets.test.ts` | 49 | CRUD, status transitions, priority, assignment, dashboard stats |
| `actions/auth.test.ts` | 16 | Login, register, logout, rate limiting, validation |
| `actions/uploads.test.ts` | 18 | File upload, removal, access control, COMPLETED ticket guard |
| `actions/analytics.test.ts` | 14 | Summary stats, filters, property/technician scoping, trends |
| `actions/profile.test.ts` | 13 | Avatar upload, removal, old avatar cleanup, cache revalidation |
| `actions/comments.test.ts` | 12 | Add comment, validation, notifications, activity log |
| `actions/notifications.test.ts` | 10 | Create, list, mark read, email side-effects |
| `actions/properties.test.ts` | 10 | CRUD, validation, manager scoping |
| `lib/utils.test.ts` | 32 | cn, formatDate, formatDateTime, timeAgo, formatFileSize |
| `lib/validations/auth.test.ts` | 20 | Login and register Zod schemas |
| `lib/constants.test.ts` | 15 | Status transitions, label maps, upload constants |
| `lib/validations/ticket.test.ts` | 14 | Ticket creation schema, boundaries |
| `lib/upload.test.ts` | 12 | Vercel Blob save/delete, MIME validation, magic bytes |
| `lib/email.test.ts` | 5 | SMTP send, HTML templates, env var fallback |
| `actions/users.test.ts` | 3 | Technician listing, role guard |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run test suite |
| `npx tsx prisma/seed.ts` | Seed demo data |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma studio` | Open Prisma Studio |

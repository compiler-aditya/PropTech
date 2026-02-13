# PropTech - Property Maintenance Management System

A mobile-first web application for managing property maintenance requests. Tenants report issues, managers assign and track work, and technicians resolve tasks efficiently.

## Features

- **Role-Based Access**: Tenant, Property Manager, and Technician roles with different permissions
- **Ticket Workflow**: Open → Assigned → In Progress → Completed with enforced transitions
- **Dashboard**: Role-specific stats and recent tickets overview
- **Activity Log**: Complete audit trail per ticket (created, assigned, status changes, comments)
- **Comments**: Threaded comments with participant notifications
- **File Uploads**: Image attachments on tickets (JPEG, PNG, WebP, GIF up to 5MB)
- **In-App Notifications**: Real-time notification bell with unread count
- **Mobile-First**: Responsive design with bottom tabs on mobile, sidebar on desktop
- **Demo Quick-Login**: One-click login for each role

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 (JWT + Credentials) |
| UI | shadcn/ui + TailwindCSS |
| Validation | Zod |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Clone the repository
git clone https://github.com/compiler-aditya/PropTech.git
cd PropTech

# Install dependencies
npm install

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
| Manager | admin@demo.com | View all tickets, assign technicians, manage properties |
| Technician | john@demo.com | View assigned tasks, update status, add comments |
| Technician | lisa@demo.com | View assigned tasks, update status |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, Register (public)
│   ├── (dashboard)/        # Dashboard, Tickets, Properties, etc. (protected)
│   └── api/auth/           # NextAuth API handler
├── actions/                # Server Actions (tickets, auth, comments, uploads, etc.)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # App shell, sidebar, mobile nav, header
│   ├── tickets/            # Ticket card, form, filters, status actions, activity log
│   ├── notifications/      # Notification list
│   ├── uploads/            # Image upload component
│   └── auth/               # Login form, demo login, register form
├── lib/                    # Prisma client, auth config, validations, utilities
└── middleware.ts           # Route protection + role-based access
```

## Architecture Decisions

- **Server Actions over API routes** for type-safe mutations without a separate API layer
- **JWT sessions** (required for CredentialsProvider) with role injection in callbacks
- **PostgreSQL** for production-ready relational storage with Prisma ORM
- **Local filesystem uploads** in `public/uploads/` — simplest approach for demo/challenge
- **Activity log as separate table** for reliable audit trails without event sourcing complexity
- **Zod validation** at server action boundaries for runtime type safety

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed demo data |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run tests |

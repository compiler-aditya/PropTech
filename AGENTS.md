# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router application. Main code lives in `src/`: routes in `src/app`, server actions in `src/actions`, shared UI in `src/components`, and auth, Prisma, validation, and utility code in `src/lib`. Keep shadcn primitives inside `src/components/ui`. Database schema, migrations, and seed data live in `prisma/`. Unit and integration-style tests live in `__tests__/`; browser flows live in `e2e/`. Static assets belong in `public/`.

## Build, Test, and Development Commands
Use `npm install` to install dependencies. Run `npm run dev` for local development and `npm run build` to verify the production bundle. Use `npm run lint` for ESLint checks. Run `npm test` for Vitest watch mode or `npm run test:run` for a single CI-style pass. Execute `npm run test:e2e` for Playwright flows. Database helpers: `npm run db:migrate`, `npm run db:seed`, `npm run db:reset`, and `npm run db:studio`. For a full local stack with PostgreSQL, use `docker compose up --build`.

## Coding Style & Naming Conventions
Write TypeScript with strict typing, 2-space indentation, semicolons, and double quotes. Use the `@/*` import alias for code under `src/`. Keep React component names in PascalCase, but match existing file naming with kebab-case like `ticket-card.tsx` and `notification-provider.tsx`. Name domain action files by area (`tickets.ts`, `properties.ts`). Prefer colocating route-specific UI under the relevant `src/app` segment and shared validation in `src/lib/validations`.

## Testing Guidelines
Vitest is configured for `__tests__/**/*.test.ts`; Playwright covers `e2e/*.spec.ts` plus `e2e/auth.setup.ts`. Reuse `__tests__/setup.ts` for shared mocks instead of redefining Next.js or Prisma stubs in each test. Run `npx vitest run --coverage` before large changes; coverage is collected from `src/**` and excludes `src/components/ui/**`. Add or update tests for new server actions, auth rules, validation logic, and role-based UI flows.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, and `test:`. Keep commit messages imperative and scoped to one change. Pull requests should explain the user-visible impact, note any schema or environment-variable changes, link the related issue, and include screenshots or short recordings for UI updates. If Prisma schema changes, include the migration and any seed updates in the same PR.

## Security & Configuration Tips
Start from `.env.example` and never commit real secrets. `DATABASE_URL`, `NEXTAUTH_SECRET`, and mail credentials are required for full functionality. Review upload, auth, and notification changes carefully because they touch access control, external storage, or outbound email.

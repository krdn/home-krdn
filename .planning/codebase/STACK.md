# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- TypeScript 5.x - All application code (`tsconfig.json`, `package.json`)

**Secondary:**
- JavaScript - Config files (`eslint.config.mjs`, `postcss.config.mjs`)

## Runtime

**Environment:**
- Node.js 20.x (Alpine Linux in production - `Dockerfile`)
- Browser runtime for React client components

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack web framework with App Router (`package.json`)
- React 19.2.3 - UI library (`package.json`)
- React DOM 19.2.3 - DOM rendering (`package.json`)

**Testing:**
- Not configured (no test framework installed)

**Build/Dev:**
- Next.js built-in bundler (Turbopack in dev mode)
- TypeScript compiler
- PostCSS with Tailwind CSS plugin (`postcss.config.mjs`)
- ESLint 9.x with Next.js config (`eslint.config.mjs`)

## Key Dependencies

**Critical:**
- Zustand 5.0.9 - Client-side state management (`package.json`)
- TanStack React Query 5.90.16 - Server state management/data fetching (`package.json`)
- Recharts 3.6.0 - Chart visualization (`package.json`)

**UI Components:**
- @radix-ui/react-dialog ^1.1.15 - Modal dialogs (`package.json`)
- @radix-ui/react-select ^2.2.6 - Select dropdowns (`package.json`)
- @radix-ui/react-slot ^1.2.4 - Component composition (`package.json`)
- @radix-ui/react-tabs ^1.1.13 - Tab navigation (`package.json`)
- @radix-ui/react-toast ^1.2.15 - Toast notifications (`package.json`)
- lucide-react 0.562.0 - Icon library (`package.json`)

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS (`package.json`)
- class-variance-authority 0.7.1 - Component variants (`src/components/ui/Button.tsx`)
- clsx 2.1.1 - Class name utilities (`src/lib/utils.ts`)
- tailwind-merge 3.4.0 - Tailwind class merging (`src/lib/utils.ts`)

**Infrastructure:**
- Node.js built-in `http` - Docker socket communication (`src/lib/docker.ts`)
- Node.js built-in `child_process` - System commands (`src/lib/system.ts`)
- Node.js built-in `os` - System metrics (`src/lib/system.ts`)

## Configuration

**Environment:**
- Environment variables via `process.env`
- `DOCKER_HOST` - Docker socket path (defaults to `/var/run/docker.sock`)
- No `.env.example` file (documented only in code)

**Build:**
- `tsconfig.json` - TypeScript compiler options with `@/*` path alias
- `next.config.ts` - Next.js standalone output mode
- `postcss.config.mjs` - PostCSS with Tailwind CSS
- `eslint.config.mjs` - ESLint with Next.js and TypeScript configs

## Platform Requirements

**Development:**
- Any platform with Node.js 20+
- No additional tooling required

**Production:**
- Docker container (Node.js 20 Alpine)
- Docker socket access for container management
- Nginx reverse proxy (`deployment/nginx/nginx.conf`)
- Resource limits: 256MB RAM (app), 64MB RAM (nginx)

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*

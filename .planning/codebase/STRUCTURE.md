# Codebase Structure

**Analysis Date:** 2026-01-14

## Directory Layout

```
home-krdn/
├── deployment/             # Deployment configuration
│   └── nginx/             # Nginx reverse proxy config
├── docs/                   # Documentation
│   └── wiki/              # Project wiki (Korean)
├── prompts/                # AI prompts archive
├── public/                 # Static assets
│   └── images/            # Image assets
├── src/                    # Source code
│   ├── app/               # Next.js App Router
│   │   ├── admin/         # Admin pages
│   │   ├── api/           # API routes
│   │   └── services/      # Service pages
│   ├── components/        # React components
│   │   ├── admin/         # Admin-specific
│   │   ├── charts/        # Chart components
│   │   ├── landing/       # Landing page
│   │   ├── layout/        # Layout components
│   │   ├── services/      # Service components
│   │   └── ui/            # UI primitives
│   ├── config/            # Configuration
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── stores/            # State stores (empty)
│   └── types/             # TypeScript types
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Docker build config
└── package.json            # Project manifest
```

## Directory Purposes

**deployment/nginx/**
- Purpose: Nginx reverse proxy configuration
- Contains: `nginx.conf`
- Key files: Proxy config for Next.js app on port 3005
- Subdirectories: None

**docs/wiki/**
- Purpose: Project documentation in Korean
- Contains: Markdown files (프로젝트-개요.md, 기술-스택.md, etc.)
- Key files: Home.md, 배포-가이드.md
- Subdirectories: None

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Pages, layouts, route handlers
- Key files: `layout.tsx`, `page.tsx`, `globals.css`
- Subdirectories: `admin/`, `api/`, `services/`

**src/app/admin/**
- Purpose: Admin dashboard pages
- Contains: Admin page components
- Key files: `layout.tsx` (sidebar wrapper), `page.tsx` (dashboard)
- Subdirectories: `containers/`, `services/`, `system/`, `logs/`

**src/app/api/**
- Purpose: API route handlers
- Contains: Route handler files
- Key files: `system/route.ts`, `docker/containers/route.ts`
- Subdirectories: `system/`, `docker/`

**src/components/**
- Purpose: Reusable React components
- Contains: Component files organized by feature
- Key files: Various .tsx files
- Subdirectories: `admin/`, `charts/`, `landing/`, `layout/`, `services/`, `ui/`

**src/components/admin/**
- Purpose: Admin-specific components
- Contains: Dashboard, monitoring components
- Key files: `SystemMonitor.tsx`, `DashboardStats.tsx`, `ContainerList.tsx`, `ContainerStats.tsx`

**src/components/ui/**
- Purpose: Base UI primitive components
- Contains: shadcn/ui style components
- Key files: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `ThemeToggle.tsx`

**src/lib/**
- Purpose: Utility functions and service integrations
- Contains: Business logic modules
- Key files: `docker.ts`, `system.ts`, `utils.ts`, `icons.ts`

**src/hooks/**
- Purpose: Custom React hooks for data fetching
- Contains: Hook implementations
- Key files: `useSystemMetrics.ts`, `useContainers.ts`

**src/config/**
- Purpose: Static configuration data
- Contains: Service definitions
- Key files: `services.ts` (11 services, 247 lines)

**src/types/**
- Purpose: TypeScript type definitions
- Contains: Interface and type files
- Key files: `system.ts`, `service.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (global structure)
- `src/app/page.tsx` - Homepage
- `src/app/admin/layout.tsx` - Admin layout (sidebar)
- `src/app/admin/page.tsx` - Admin dashboard

**Configuration:**
- `tsconfig.json` - TypeScript config (path alias: `@/*`)
- `next.config.ts` - Next.js config (standalone output)
- `postcss.config.mjs` - PostCSS/Tailwind config
- `eslint.config.mjs` - ESLint config
- `docker-compose.yml` - Docker deployment

**Core Logic:**
- `src/lib/docker.ts` - Docker API client (Unix socket)
- `src/lib/system.ts` - System metrics collection
- `src/lib/utils.ts` - Utility functions (cn, formatBytes, etc.)
- `src/config/services.ts` - Service catalog

**Testing:**
- Not configured (no test files)

**Documentation:**
- `README.md` - Project readme (generic template)
- `docs/wiki/` - Korean documentation

## Naming Conventions

**Files:**
- PascalCase.tsx: React components (`Hero.tsx`, `Sidebar.tsx`, `Button.tsx`)
- camelCase.ts: Utilities and hooks (`utils.ts`, `docker.ts`, `useSystemMetrics.ts`)
- kebab-case.md: Documentation (`프로젝트-개요.md`)
- route.ts: API route handlers (Next.js convention)
- page.tsx: Page components (Next.js convention)
- layout.tsx: Layout components (Next.js convention)

**Directories:**
- lowercase: All directories (`admin`, `components`, `lib`)
- Plural for collections: `components/`, `hooks/`, `types/`
- Feature-based grouping: `admin/`, `landing/`, `services/`

**Special Patterns:**
- `[id]`: Dynamic route segments (Next.js convention)
- `globals.css`: Global styles (Next.js convention)
- No barrel files (index.ts) - direct imports only

## Where to Add New Code

**New Page:**
- Implementation: `src/app/{route-name}/page.tsx`
- Layout if needed: `src/app/{route-name}/layout.tsx`
- Components: `src/components/{feature-name}/`

**New API Endpoint:**
- Implementation: `src/app/api/{endpoint}/route.ts`
- Types: `src/types/{domain}.ts`
- Business logic: `src/lib/{domain}.ts`

**New Component:**
- UI primitive: `src/components/ui/{ComponentName}.tsx`
- Feature component: `src/components/{feature}/{ComponentName}.tsx`
- Types: Inline or in `src/types/`

**New Hook:**
- Implementation: `src/hooks/use{HookName}.ts`
- Follow pattern of existing hooks (polling with useEffect)

**New Utility:**
- Shared helpers: `src/lib/utils.ts`
- Domain-specific: `src/lib/{domain}.ts`

**New Service Config:**
- Add to array: `src/config/services.ts`

## Special Directories

**.next/**
- Purpose: Next.js build output
- Source: Auto-generated by Next.js
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (in .gitignore)

**public/**
- Purpose: Static assets served at root
- Source: Manual addition
- Committed: Yes

**.planning/**
- Purpose: GSD project planning files
- Source: Created by GSD commands
- Committed: Yes

---

*Structure analysis: 2026-01-14*
*Update when directory structure changes*

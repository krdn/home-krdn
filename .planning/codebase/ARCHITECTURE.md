# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Modern Full-Stack Next.js Application with Server & Client Components

**Key Characteristics:**
- Next.js 16 App Router architecture
- Mix of Server and Client Components
- API routes for system integration
- Configuration-driven service catalog
- Real-time data fetching via polling

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interface and handle interactions
- Contains: React components, styling, client-side state
- Location: `src/components/`
- Depends on: Hooks, utility functions, configuration
- Used by: Pages (App Router)

**Page/Route Layer (Next.js App Router):**
- Purpose: Define routes and page structure
- Contains: Pages, layouts, route handlers
- Location: `src/app/`
- Depends on: Components, layouts
- Used by: Next.js router

**API Layer:**
- Purpose: Server-side endpoints for data fetching
- Contains: Route handlers for system/Docker integration
- Location: `src/app/api/`
- Depends on: Library functions
- Used by: Client-side hooks

**Service/Library Layer:**
- Purpose: Business logic and system integration
- Contains: Docker client, system metrics, utilities
- Location: `src/lib/`
- Depends on: Node.js built-ins, Docker socket
- Used by: API routes

**Data/State Layer:**
- Purpose: Manage client-side state and data fetching
- Contains: Custom React hooks with polling
- Location: `src/hooks/`
- Depends on: API endpoints
- Used by: Components

**Configuration Layer:**
- Purpose: Static data definitions
- Contains: Service catalog, helper functions
- Location: `src/config/`
- Depends on: Types
- Used by: Components, pages

**Type Layer:**
- Purpose: TypeScript type definitions
- Contains: Interfaces, type aliases
- Location: `src/types/`
- Depends on: Nothing
- Used by: All layers

## Data Flow

**System Metrics Flow:**

1. User navigates to admin dashboard
2. `useSystemMetrics()` hook initializes with polling interval
3. Hook fetches `/api/system` endpoint
4. API route calls `getSystemMetrics()` from `src/lib/system.ts`
5. Library executes system commands and parses `/proc/stat`
6. Formatted metrics returned as JSON response
7. Hook updates component state
8. UI re-renders with new data
9. Polling continues at configured interval

**Docker Container Flow:**

1. User views container list
2. `useContainers()` hook fetches `/api/docker/containers`
3. API route calls `listContainers()` from `src/lib/docker.ts`
4. Library sends HTTP request over Unix socket to Docker daemon
5. Docker API returns container information
6. Response parsed and returned to client
7. Container cards rendered with status badges

**Container Action Flow:**

1. User clicks start/stop/restart button
2. `performAction()` called with container ID and action
3. POST request to `/api/docker/containers/[id]`
4. API route calls appropriate Docker function
5. Docker daemon executes action
6. After delay, container list refetched
7. UI updates to reflect new state

**State Management:**
- Server state: API routes with no persistence
- Client state: React hooks with `useState`
- Polling-based: Fixed intervals for real-time updates
- No global state store actively used (Zustand installed but unused)

## Key Abstractions

**Docker Client (`src/lib/docker.ts`):**
- Purpose: HTTP over Unix socket communication
- Pattern: Async Promise-based API
- Examples: `listContainers()`, `getContainer()`, `startContainer()`
- Key function: `dockerRequest<T>()` - Generic HTTP client

**System Metrics (`src/lib/system.ts`):**
- Purpose: Collect system resource information
- Pattern: Synchronous command execution with parsing
- Examples: `getCpuUsage()`, `getMemoryInfo()`, `getDiskInfo()`
- Key function: `getSystemMetrics()` - Aggregates all metrics

**Custom Hooks (`src/hooks/`):**
- Purpose: Encapsulate data fetching with polling
- Pattern: `useState` + `useEffect` + `setInterval`
- Examples: `useSystemMetrics()`, `useContainers()`
- Key pattern: Interval-based polling with cleanup

**Service Configuration (`src/config/services.ts`):**
- Purpose: Static service catalog
- Pattern: Array of service objects with helper functions
- Examples: `getServiceById()`, `getServicesByCategory()`
- Key pattern: Configuration-driven UI

**UI Components (`src/components/ui/`):**
- Purpose: Reusable UI primitives
- Pattern: shadcn/ui style with CVA variants
- Examples: `Button`, `Card`, `Badge`
- Key pattern: `cn()` utility for class merging

## Entry Points

**Root Layout (`src/app/layout.tsx`):**
- Triggers: Every page load
- Responsibilities: HTML structure, fonts, global styles, Header/Footer

**Homepage (`src/app/page.tsx`):**
- Triggers: Navigation to `/`
- Responsibilities: Render Hero, ServiceCategories, FeaturedServices

**Admin Layout (`src/app/admin/layout.tsx`):**
- Triggers: Navigation to `/admin/*`
- Responsibilities: Sidebar wrapper for admin pages

**Admin Dashboard (`src/app/admin/page.tsx`):**
- Triggers: Navigation to `/admin`
- Responsibilities: Dashboard stats, quick links

**API Routes:**
- `src/app/api/system/route.ts` - System metrics endpoint
- `src/app/api/docker/containers/route.ts` - Container listing
- `src/app/api/docker/containers/[id]/route.ts` - Container details/actions

## Error Handling

**Strategy:** Try/catch with error propagation, console logging

**Patterns:**
- API routes: Try/catch returning `NextResponse.json({ success: false, error: message })`
- Hooks: Catch errors, set error state, log to console
- Docker client: Returns empty arrays on failure, logs errors
- System metrics: Falls back to alternative methods on error

## Cross-Cutting Concerns

**Logging:**
- Console.log/console.error throughout
- No structured logging library
- Error context included in log messages

**Validation:**
- Minimal input validation
- TypeScript types provide compile-time checks
- No runtime validation library (no zod/yup)

**Authentication:**
- Not implemented
- All routes publicly accessible
- No middleware.ts for route protection

**Theming:**
- CSS custom properties in `src/app/globals.css`
- Dark theme default, light theme via `.light` class
- Theme toggle component (`src/components/ui/ThemeToggle.tsx`)

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*

# Coding Conventions

**Analysis Date:** 2026-01-14

## Naming Patterns

**Files:**
- PascalCase.tsx for React components: `Hero.tsx`, `Button.tsx`, `ServiceCard.tsx`
- camelCase.ts for utilities/hooks: `utils.ts`, `docker.ts`, `useSystemMetrics.ts`
- route.ts for API handlers (Next.js convention)
- page.tsx/layout.tsx for pages (Next.js convention)

**Functions:**
- camelCase for all functions: `formatBytes()`, `getSystemMetrics()`, `listContainers()`
- No special prefix for async functions
- Handler naming: No specific pattern (inline handlers common)
- Hook naming: `use` prefix: `useSystemMetrics`, `useContainers`

**Variables:**
- camelCase for variables: `runningCount`, `isActive`, `containerInfo`
- UPPER_SNAKE_CASE for constants: Not commonly used
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces: `SystemMetrics`, `ContainerInfo`, `Service`
- PascalCase for type aliases: `ServiceStatus`, `ServiceCategory`
- No `I` prefix for interfaces
- Props suffix for component props: `ButtonProps`, `ServiceCardProps`

## Code Style

**Formatting:**
- ESLint with Next.js config (`eslint.config.mjs`)
- No Prettier config (ESLint handles formatting)
- Double quotes for JSX attributes
- Semicolons required
- 2-space indentation (inferred)
- ~80-100 character line length (no strict enforcement)

**Linting:**
- ESLint 9.x with `eslint-config-next`
- TypeScript ESLint integration
- Run: `npm run lint`
- Strict mode in `tsconfig.json`

## Import Organization

**Order:**
1. React/Next.js imports: `import Link from "next/link"`
2. External packages: `import { Loader2 } from "lucide-react"`
3. Internal modules with alias: `import { cn } from "@/lib/utils"`
4. Relative imports: Not commonly used (prefer alias)
5. Type imports: Inline with regular imports

**Grouping:**
- No strict blank line rules observed
- Generally grouped by source

**Path Aliases:**
- `@/*` maps to `src/*` (`tsconfig.json`)
- Example: `import { Button } from "@/components/ui/Button"`

## Error Handling

**Patterns:**
- Try/catch at API route level
- Errors logged with `console.error`
- Catch blocks return error responses: `NextResponse.json({ success: false, error: message })`

**Error Types:**
- Generic Error objects thrown
- No custom error classes
- Error messages in English/Korean mix

**Async Errors:**
- Try/catch blocks in async functions
- No `.catch()` chains (async/await preferred)

## Logging

**Framework:**
- Console.log for normal output
- Console.error for errors
- No structured logging library

**Patterns:**
- Error logging includes context: `console.error("Docker daemon error:", error)`
- Debug logging minimal
- No log levels beyond console methods

## Comments

**When to Comment:**
- JSDoc-style blocks for modules and functions (Korean descriptions)
- Section comments in JSX: `{/* Background gradient */}`
- Inline comments for complex logic (Korean)

**JSDoc/TSDoc:**
- Module-level documentation with Korean descriptions
- Function parameters rarely documented
- Example from `src/lib/docker.ts`:
  ```typescript
  /**
   * Docker API Client
   * Docker socket을 통해 컨테이너 정보를 가져옵니다.
   */
  ```

**TODO Comments:**
- None found in codebase (clean)

## Function Design

**Size:**
- Functions generally under 50 lines
- Some larger functions in `src/lib/docker.ts` (~40 lines)

**Parameters:**
- Max 2-3 parameters typical
- Default values used: `formatBytes(bytes: number, decimals = 2)`
- Destructuring for props: `({ className, variant, size, ...props })`

**Return Values:**
- Explicit return types declared
- Early returns for error cases
- Promises for async operations

## Module Design

**Exports:**
- Named exports preferred: `export function Hero()`
- Default exports not used
- Re-export from components: `export { Button, buttonVariants }`

**Barrel Files:**
- Not used - direct file imports
- Example: `import { Button } from "@/components/ui/Button"`

## React Patterns

**Component Definitions:**
- Function components exclusively
- `"use client"` directive for client components
- Server Components by default

**Component Composition:**
- `React.forwardRef` for primitive UI components
- `asChild` pattern from Radix UI
- Example from `src/components/ui/Button.tsx`:
  ```typescript
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
  ```

**State Management:**
- `useState` for local state
- Custom hooks for data fetching
- No global state (Zustand installed but unused)

**Styling Pattern:**
- `cn()` utility from `src/lib/utils.ts`
- CVA (class-variance-authority) for variants
- Tailwind CSS classes
- Example:
  ```typescript
  className={cn(
    "base-classes",
    conditional && "conditional-classes",
    className
  )}
  ```

## API Route Patterns

**Request Handling:**
- Async route handlers: `export async function GET(request: NextRequest)`
- Params via destructuring: `{ params }: { params: Promise<{ id: string }> }`
- Body parsing: `await request.json()`

**Response Format:**
```typescript
return NextResponse.json({
  success: true,
  data: result,
});

return NextResponse.json({
  success: false,
  error: "Error message",
});
```

---

*Convention analysis: 2026-01-14*
*Update when patterns change*

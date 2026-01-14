# Codebase Concerns

**Analysis Date:** 2026-01-14

## Security Considerations

**Missing API Authentication:**
- Risk: All API endpoints publicly accessible, including Docker management
- Files: `src/app/api/system/route.ts`, `src/app/api/docker/containers/route.ts`, `src/app/api/docker/containers/[id]/route.ts`
- Current mitigation: None
- Recommendations: Implement authentication middleware (JWT, API keys) for all `/api/*` routes

**Unsafe System Command Execution:**
- Risk: `execSync` used without input validation
- File: `src/lib/system.ts` (lines 40, 77)
- Code: `execSync('cat /proc/stat | head -1')`, `execSync(\`df -B1 ${path} | tail -1\`)`
- Current mitigation: Default path value only
- Recommendations: Validate/sanitize the `path` parameter, use allowlist

**Docker Socket Access:**
- Risk: Direct Unix socket communication without additional access control
- File: `src/lib/docker.ts` (line 38)
- Current mitigation: OS-level socket permissions
- Recommendations: Consider adding application-level authorization for sensitive operations

**No Input Validation on Container Actions:**
- Risk: Container ID and action parameters not validated
- File: `src/app/api/docker/containers/[id]/route.ts`
- Current mitigation: Docker API constraints prevent injection
- Recommendations: Add explicit input validation with allowlist for actions

## Tech Debt

**Duplicate Formatting Functions:**
- Issue: `formatBytes()` and `formatUptime()` duplicated
- Files: `src/lib/utils.ts`, `src/lib/system.ts`
- Why: Functions added to both files during rapid development
- Impact: Maintenance burden, risk of divergence
- Fix approach: Remove from `src/lib/system.ts`, import from `src/lib/utils.ts`

**Large Configuration File:**
- Issue: 247-line hardcoded service definitions
- File: `src/config/services.ts`
- Why: Quick implementation for MVP
- Impact: Unmaintainable for many services
- Fix approach: Migrate to database or external JSON config

**Type Casting Without Validation:**
- Issue: `JSON.parse(data) as T` assumes runtime matches types
- Files: `src/lib/docker.ts` (line 64)
- Why: TypeScript trust pattern
- Impact: Silent failures if Docker API changes
- Fix approach: Add runtime validation (zod, yup)

**Magic Numbers in Components:**
- Issue: Hardcoded thresholds (90, 70, 50) for status colors
- File: `src/components/admin/SystemMonitor.tsx`
- Why: Quick implementation
- Impact: Cannot adjust without code changes
- Fix approach: Move to configuration constants

## Performance Bottlenecks

**Synchronous Disk Info:**
- Problem: `getDiskInfo()` uses `execSync` blocking event loop
- File: `src/lib/system.ts` (lines 75-100)
- Cause: Simpler implementation with sync execution
- Improvement path: Use async `exec()` or cache results

**Fixed Polling Intervals:**
- Problem: No backoff on failures, constant polling regardless of load
- Files: `src/hooks/useSystemMetrics.ts` (5s), `src/hooks/useContainers.ts` (10s)
- Cause: Simple interval-based approach
- Improvement path: Add exponential backoff on errors

**No Pagination for Containers:**
- Problem: Fetches all containers without limit
- File: `src/lib/docker.ts` (line 85)
- Cause: Works fine for small number of containers
- Improvement path: Add pagination parameters

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: Everything
- Risk: Bugs go undetected, refactoring is risky
- Priority: High
- Difficulty: Medium - need to set up test framework first

**Critical Untested Areas:**
- `src/lib/docker.ts` - Docker communication (High priority)
- `src/lib/system.ts` - System metrics parsing (High priority)
- `src/app/api/` - All API endpoints (Medium priority)
- `src/hooks/` - Data fetching hooks (Medium priority)

## Missing Critical Features

**Authentication System:**
- Problem: No login, no protected routes
- Current workaround: None - all routes public
- Blocks: Production deployment security
- Implementation complexity: Medium (Next-Auth or custom JWT)

**Health Check Endpoint:**
- Problem: No `/api/health` for monitoring/load balancers
- Current workaround: Nginx health check to app directly
- Blocks: Proper production monitoring
- Implementation complexity: Low

**Rate Limiting:**
- Problem: No API rate limiting
- Current workaround: None
- Blocks: DDoS protection
- Implementation complexity: Low (middleware)

## Documentation Gaps

**Missing .env.example:**
- Problem: No environment variable documentation
- File needed: `.env.example`
- Current workaround: Read code to find `process.env.*`
- Fix: Create `.env.example` with `DOCKER_HOST`

**Generic README:**
- Problem: Still contains Next.js boilerplate
- File: `README.md`
- Impact: New developers can't onboard easily
- Fix: Update with actual project info

**No API Documentation:**
- Problem: No docs for `/api/system` and `/api/docker/*`
- Current workaround: Read route handler code
- Fix: Add OpenAPI/Swagger or `docs/API.md`

## Known Issues

**Unhandled HTTP Status Codes:**
- Symptoms: Error responses parsed as successful JSON
- Trigger: Docker API returns non-200 status
- File: `src/lib/docker.ts` (lines 57-68)
- Workaround: Errors eventually surface as parse errors
- Root cause: No status code validation before JSON.parse

**Silent Failures in Container List:**
- Symptoms: Empty container list on Docker errors
- Trigger: Docker daemon unreachable
- File: `src/lib/docker.ts` (lines 82-102)
- Workaround: Check console for errors
- Root cause: Returns empty array on error, no error propagation

**Race Condition in Container Actions:**
- Symptoms: UI doesn't reflect container state change
- Trigger: Container action takes longer than 1 second
- File: `src/hooks/useContainers.ts` (line 67)
- Workaround: Manual refresh
- Root cause: Fixed 1-second delay before refetch

## Positive Observations

The codebase is generally well-structured:
- ✅ Good separation of concerns
- ✅ TypeScript strict mode enabled
- ✅ Clean component composition
- ✅ No hardcoded secrets
- ✅ No TODO/FIXME comments (clean)
- ✅ Proper error handling try/catch in most places
- ✅ Modern React patterns (hooks, server components)

---

*Concerns audit: 2026-01-14*
*Update as issues are fixed or new ones discovered*

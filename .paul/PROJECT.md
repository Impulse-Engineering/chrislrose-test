# Project: chrislrose

## Description
Migrate the existing vanilla HTML/JS personal website and Supabase-backed reading list to a TypeScript + Hono stack with Cloudflare (D1/Workers) replacing Supabase as the backend. A new development app will be registered for this work while the existing codebase serves as reference.

## Core Value
A personal web presence that showcases who Chris is and helps him organize, curate, and share his reading list.

## Requirements

### Validated
- Hono v4 + TypeScript project scaffold on Cloudflare Workers -- Phase 1
- Shared Layout/Nav components with SSR -- Phase 1
- Homepage with full content parity (hero, cards, CTA) -- Phase 1
- Intro animation, constellation particles, custom cursor effects -- Phase 1
- Dev server running via wrangler dev -- Phase 1

### Must Have
- D1 database schema and typed query helpers
- PBKDF2 auth with session management
- Server-rendered pages: about, contact, uses
- Reading list with CRUD, search, filters
- Admin system for links, categories, gear
- Collections and sharing with OG tags
- Data migration from Supabase to D1
- Production deployment to Cloudflare Workers

### Should Have
- Bookmarklet for saving links
- Cache busting for static assets
- Legacy URL redirects (c.html -> /c/:id)

### Nice to Have
- Performance optimizations beyond baseline

## Constraints
- No PHP on hosting (Cloudflare Workers)
- OG images must be PNG 1200x630
- Existing site remains live during migration

## Success Criteria
- Core value is preserved: personal bio + reading list management/sharing works
- Visual parity with existing site
- All existing functionality migrated
- TypeScript type safety throughout

## Specialized Flows

See: .paul/SPECIAL-FLOWS.md

Quick Reference:
- /brainstorming → Feature design, new functionality
- /writing-plans → Multi-step implementation tasks
- /frontend-design → UI components, pages, layouts
- /ui-design-system → Design tokens, component docs
- /systematic-debugging → Bug fixes, test failures
- /using-git-worktrees → Feature isolation
- /subagent-driven-development → Parallel implementation tasks
- /finishing-a-development-branch → Branch completion, merge/PR
- /mintlify → Documentation site

## Key Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| GSAP via CDN, not bundled | 1 | Keep Workers bundle small |
| Layout headExtra/bodyExtra props | 1 | Page-specific scripts without polluting all pages |
| Cursor glow as new feature | 1 | User-requested enhancement beyond original site |

---
*Last updated: 2026-03-24 after Phase 1*

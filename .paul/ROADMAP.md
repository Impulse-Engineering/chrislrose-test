# Roadmap: chrislrose

## Overview
Migrate from a static HTML/JS site with Supabase to a modern TypeScript + Hono application on Cloudflare Workers with D1, preserving all existing functionality (bio pages, reading list CRUD, collections/sharing, admin, bookmarklet) while gaining type safety and edge performance.

## Current Milestone
**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 2 of 8 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Foundation | 1/1 | Complete | 2026-03-24 |
| 2 | Database & Auth | 1/1 | Complete | 2026-03-24 |
| 3 | Static Pages | TBD | Not started | - |
| 4 | Reading List Core | TBD | Not started | - |
| 5 | Admin System | TBD | Not started | - |
| 6 | Collections & Sharing | TBD | Not started | - |
| 7 | Data Migration | TBD | Not started | - |
| 8 | Testing & Deployment | TBD | Not started | - |

## Phase Details

### Phase 1: Foundation
Project scaffolding — Hono + Wrangler + TypeScript config, project structure, shared types, base layout component. Gets `wrangler dev` running with a hello-world route.

### Phase 2: Database & Auth
D1 schema creation, typed query helpers, PBKDF2 password lib, session management, auth middleware, auth API routes (login/logout/session check).

### Phase 3: Static Pages
Layout/Nav/Footer components, CSS migration, server-rendered pages: homepage, about, contact, uses (gear display). Gear API endpoints.

### Phase 4: Reading List Core
Reading list page (server-rendered), links CRUD API, categories API, client-side JS for search/filter/status toggles.

### Phase 5: Admin System
Login page UI, admin dashboard, link add/edit/delete modals, category management UI, gear admin CRUD, content editing.

### Phase 6: Collections & Sharing
Collections API, collection share page with OG tags, curation mode (selection + share link generation), bookmarklet, metadata fetch endpoint.

### Phase 7: Data Migration
Supabase export script, data transformation (booleans, dates), D1 import with correct FK ordering, row count verification.

### Phase 8: Testing & Deployment
vitest + miniflare tests for API/auth, legacy URL redirects (c.html → /c/:id), cache busting setup, wrangler deploy to `dev.chrislrose.aseva.ai`, smoke testing.

---
*Roadmap created: 2026-03-23*
*Phases defined: 2026-03-23*

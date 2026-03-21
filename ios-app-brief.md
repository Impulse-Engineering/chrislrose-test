# iOS Reading List App — Full Brief

*Written 2026-03-21. Captures every decision, idea, and technical detail from the planning conversation so work can resume on any machine. When starting the build, read this entire document first.*

---

## Concept

A native iOS 26 reading list app that connects to the same Supabase database powering `https://chrislrose.aseva.ai/reading-list.html`. This is **not a web wrapper** — it's a fully native SwiftUI app designed to feel like it belongs alongside Apple's own apps on iOS 26, using Liquid Glass, spring animations, and on-device AI.

The app is primarily a **reading and discovery experience**. Saving articles continues through the existing iOS Shortcut/bookmarklet workflow (this was a deliberate decision, see below).

---

## Key Decisions Made

### What the app IS
- Native SwiftUI reader for the existing Supabase `links` table
- Browse, search, filter, read articles in-app
- On-device AI enrichment (title cleanup, summaries, auto-tagging, triage)
- Full iOS 26 Liquid Glass design language
- Bidirectional with the website — changes in the app appear on the web and vice versa

### What the app is NOT
- Not a replacement for the web admin panel (adding categories, managing collections stays web-only)
- No Share Extension — deliberately skipped because:
  - Without $99/year developer account, app + extension expire every 7 days
  - A broken share sheet mid-workflow is worse than no share sheet
  - The existing iOS Shortcut → bookmarklet → Supabase flow already works from any app
- Not an offline-first app (requires network to load — but could cache locally for read-only browsing)

### Saving flow (unchanged — keep exactly as-is)
1. User taps Share in any iOS app
2. Existing iOS Shortcut appears in the share sheet
3. Shortcut calls the bookmarklet → opens `https://chrislrose.aseva.ai/reading-list.html?add=URL`
4. Article metadata is fetched (via Microlink API at `https://api.microlink.io?url=`) and saved to Supabase
5. App picks up the new article on next open or pull-to-refresh

### Developer account
- **No paid Apple Developer account** ($99/year)
- Free personal team in Xcode → app installs via USB
- Cert expires every 7 days → reconnect phone to Mac, hit Run (~30 seconds)
- Acceptable because the app is a reader — when it expires, no active workflows break (unlike a Share Extension)
- **If friend-sharing is desired later**: $99 account + TestFlight is the only real option (up to 10,000 testers, no App Store review, 90-day builds)

---

## Supabase Connection

```
URL:      https://ownqyyfgferczpdgihgr.supabase.co
Anon key: sb_publishable_RPJSQlVO4isbKnZve8NlWg_55EO350Y
```

The anon key is a **publishable** key (read-only for public data). For write operations (Enrich saving back), the app needs Supabase auth — same email/password used on the web admin. The app should prompt once and persist the session.

### Tables the app uses
| Table | Usage |
|---|---|
| `links` | Main reading list — all articles |
| `categories` | Managed category list (`name`, `sort_order`) |
| `collections` | Curated link bundles (read-only in app — just display if user opens a collection URL) |

### links data model (complete)
```
id            uuid (PK)
url           text
title         text
description   text          — OG description
image         text          — OG image URL (used for card thumbnails)
favicon       text          — site favicon URL
domain        text          — extracted domain (e.g. "nytimes.com")
category      text          — single category from categories table
tags          text          — freeform comma-separated (e.g. "ai, tools, review")
stars         int           — 1–5 rating
note          text          — personal note (visible to visitors on web)
status        text          — 'to-read' | 'to-try' | 'to-share' | 'done' | null
read          boolean       — kept in sync with status (read = status is 'done')
private       boolean       — if true, only visible when authenticated
saved_at      timestamptz   — when the article was saved
```

**Important sync rule**: When changing `status`, always also set `read = (status == 'done')` to maintain backwards compatibility with the web frontend.

### Authentication
The web app uses Supabase email/password auth. The iOS app should:
1. Show a sign-in screen on first launch (email + password)
2. Store the session using Supabase Swift SDK's built-in session persistence
3. Once authenticated, all features work (including writes for Enrich, status changes, star ratings)
4. Private links are only fetched when authenticated: `.eq('private', false)` filter must be applied for unauthenticated queries

---

## iOS 26 Design — Making This Feel Premium

### The visual identity
This app should look like it was designed by Apple's team, not like a developer's side project. The design language is iOS 26's **Liquid Glass** — translucent materials, depth, light refraction, and physics-based interactions.

### Liquid Glass implementation
- `.glassEffect(.regular)` on article cards — the article's OG image shows through as a blurred, tinted background with the title/metadata overlaid in sharp text
- `.glassEffect()` on the search bar, filter chips, action sheets, and the floating tab bar
- `GlassEffectContainer` to coordinate glass elements so they transition coherently together
- `.interactive()` on tappable glass elements for the signature bounce/shimmer feedback
- Always provide non-glass fallbacks gated with `#available(iOS 26, *)`

### Card design — the hero moment
Each article card should be **visually striking**, not a plain list row:

**When the article has an OG image** (`link.image` is not null):
- Full-bleed image as the card background
- Liquid Glass overlay on the lower third with title, domain, and tags
- The glass picks up colors from the image creating a unique tint per card
- This is the Apple Invites pattern — glass over imagery

**When there is no OG image:**
- The web app already has brand-colored SVG placeholders for known domains (Reddit, GitHub, YouTube, Medium, HN, Substack, LinkedIn, etc. — see `sourceLogos` in reading-list.js)
- Replicate these as gradient backgrounds with the source icon
- For unknown domains: use the domain initial letter on a neutral gradient, same as the web fallback (`generateFallbackSvg`)

**Card metadata layout:**
- Favicon + domain name
- Star rating (filled/empty stars)
- Save date
- Note preview (if exists) — 2 lines max, truncated
- Category tag + any comma-separated tags
- Status pill (colored: blue for to-read, orange for to-try, pink for to-share, green for done)

### Tab bar
- Floating Liquid Glass tab bar using iOS 26's native styling
- `.tabBarMinimizeBehavior(.onScrollDown)` — hides while scrolling the article list, reappears on scroll up
- 3-4 tabs (see App Structure below)

### Animations
- **Spring animations everywhere**: card appear/disappear, sheet presentations, filter transitions, pull-to-refresh
- `.spring(duration: 0.5, bounce: 0.6)` as the default timing
- Cards should stagger-animate on initial load (0.05s delay per card)
- Tab switching: crossfade content, don't just swap

### Dark/Light mode
- Follow system setting automatically (iOS handles this)
- In Reader mode, also offer a Sepia option
- All colors from Supabase status values map to iOS semantic colors

### Typography
- System font (San Francisco) for UI
- Reader mode: user's choice of system sans-serif, New York (serif), or a monospace option
- Dynamic Type support throughout — text scales with accessibility settings

---

## Foundation Models (On-Device AI)

All AI runs via `FoundationModels` framework (iOS 26). On-device, private, no API cost, works offline (after article metadata is cached).

### The Enrich Button — core feature

Every article card gets an **Enrich** action (button, swipe action, or long-press menu). Tapping it:

1. **Cleans the title** — strips site names, pipes, SEO junk
   - Input: `"The 10 Best AI Tools You NEED in 2025 | TechCrunch"`
   - Output: `"10 Essential AI Tools for 2025"`
2. **Generates a TL;DR** — 2-3 sentence summary from the title + description + any existing note
   - Saved to the `note` field in Supabase
3. **Suggests tags** — analyzes content and proposes tags from a combination of existing tags in the library + new suggestions
   - Shown as tappable chips — user accepts or dismisses each
4. **Suggests a category** — picks the best match from the existing `categories` table
   - Shown as a highlighted suggestion — user confirms or picks a different one
5. **Suggests a status** — infers from content type:
   - Tutorial/how-to → `to-try`
   - Opinion/news/essay → `to-share`
   - Deep technical/research → `to-read`
   - Already read (based on title recognition) → `done`

**UX flow:**
- User taps Enrich
- A Liquid Glass sheet slides up showing all suggestions at once
- Each suggestion has Accept/Dismiss controls
- User reviews, optionally edits, taps "Save"
- Writes back to Supabase → shows up on the website too
- **Crucially:** the user always reviews before saving. Never auto-write AI suggestions.

### Enrich All (batch)
A toolbar button that runs enrichment across all un-enriched articles in the background. Progress indicator shows "Enriching 4 of 12..." — user can keep browsing.

### Batch Triage View
Dedicated swipeable card stack:
- Shows un-enriched articles one at a time, full-screen card
- AI suggestions displayed right on the card
- Swipe right → accept all suggestions for this article
- Swipe left → skip
- Swipe down → open the article to read it first
- Very fast for processing a large backlog after a vacation

### Additional AI features (build in later phases)
- **Natural language search** — "articles about SwiftUI I haven't read" → interpreted across all fields
- **Related articles** — at the bottom of each article view, "Similar in your library" based on content
- **Daily digest** — morning notification: "12 unread. 4 about AI. Here are 3 good ones to start with."
- **Cross-article insights** — "You've saved 9 articles about AI agents this month"
- **"Why did I save this?"** — for old backlog items, infer from surrounding saves
- **Note expansion** — user types "good ref" → model expands based on article context
- **Duplicate detection** — "You saved something similar 3 weeks ago — link them?"

---

## Article Reading — Three Modes

Three ways to read articles. A **Reader | Web** toggle in the toolbar switches between modes. Smart fallback chain selects automatically:

```
Tap to read
    ↓
Pre-fetched content in Supabase? → Reader view (instant, offline)
    ↓ not available
Fetch + parse with Readability? → Reader view (clean, no ads)
    ↓ fails (paywall / JS-heavy / blocked)
Full WebKit view → always works
```

### Mode 1 — Full WebKit (WKWebView)
- Full webpage inside the app, no leaving to Safari
- Supports paywalls (user can log in), JavaScript-heavy sites
- Slowest option but always works
- Build first — trivial

### Mode 2 — Reader View (Readability parsing)
- Strips page to article text + images in clean typography
- Uses Mozilla's **Readability.js** (bundled inside a hidden WKWebView for parsing, or a Swift port)
- Same tech as Safari Reader, Reeder, Instapaper, Pocket
- Fails gracefully — falls back to WebKit
- Build second — this is the everyday reading experience

### Mode 3 — Pre-fetched (instant, offline)
- Article text fetched and stored at save time via a **Supabase Edge Function** running Readability
- New `content` column on `links` table
- Loads instantly, works fully offline
- Content is frozen at save time (acceptable trade-off)
- Build last — needs backend work

### Reader typography controls
- Font size slider
- Line height adjustment
- Font choice: system sans-serif (San Francisco) / serif (New York) / monospace
- Color theme: Dark / Light / Sepia
- Settings persist in UserDefaults

---

## App Structure

### Tab bar (3 tabs for Phase 1, 4 for Phase 4)

| Tab | Icon | Purpose |
|---|---|---|
| **Library** | `books.vertical` | Main feed — all articles with filters |
| **Search** | `magnifyingglass` | Dedicated search (Tab role: `.search`) — keyword + natural language later |
| **Triage** | `sparkles` | Batch enrichment / swipe-to-process |
| **Insights** | `chart.bar` | Reading stats, AI insights, streaks (Phase 4) |

### Library tab (main screen)
**Filter bar (sticky, scrollable chips):**
- Status: All / To Read / To Try / To Share / Done
- Categories: All + each category from Supabase (same as web)
- Sort: Newest / Stars

**Article list:**
- Pull-to-refresh triggers Supabase reload
- Cards use the Liquid Glass + image design described above
- Swipe left → quick actions: Change Status, Enrich, Delete
- Swipe right → mark as Done (or toggle read/unread)
- Tap → opens article in Reader/WebView
- Long press → context menu: Enrich, Copy URL, Share via iOS share sheet, Open in Safari, Delete

**Empty states:**
- No articles: friendly illustration + "Your reading list is empty. Save articles from Safari using your Shortcut."
- No results for filter: "No articles matching these filters."
- No results for search: "No articles matching '[query]'"

### Article detail screen
- Full-bleed hero image (if available) with parallax scroll
- Title, domain + favicon, save date
- Star rating (tappable to change)
- Status pill (tappable to change)
- Tags (displayed, not editable in-app)
- Category badge
- Note (editable — tap to expand, keyboard appears)
- TL;DR summary (if enriched, shown in a callout box)
- "Read Article" button → opens Reader/WebView
- "Enrich" button (if not yet enriched)
- "Related" section at bottom (Phase 3+ with Foundation Models)

### Search tab
- Large search field at top
- Recent searches (persisted locally)
- Live results as you type
- Multi-token fuzzy search matching the web behavior: split query on whitespace, each token must appear somewhere in title + description + note + domain + category + tags
- Phase 3: natural language search via Foundation Models ("articles about AI from last month that I haven't read")

### Triage tab
- Swipeable card stack showing un-enriched articles
- Each card shows: image, title, domain, and AI suggestions overlaid
- Swipe right = accept, left = skip, down = open to read
- Counter: "4 of 12 remaining"
- When done: celebratory animation, "All caught up!"

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Swift |
| UI | SwiftUI, iOS 26 target minimum |
| Backend | Supabase (existing, shared with website) |
| Supabase SDK | `github.com/supabase/supabase-swift` (official) |
| AI | `FoundationModels` framework (iOS 26, on-device) |
| Article parsing | Readability.js bundled in WKWebView, or Swift equivalent |
| Architecture | MVVM — ViewModels publish state, Views observe |
| Local caching | SwiftData or UserDefaults for preferences; Supabase SDK handles auth session |

---

## Development Setup (on the new Mac)

1. Install **Xcode 26** from the Mac App Store (~15GB)
2. Pull this repo: `git clone https://github.com/chrislrosesb/test.git`
3. Create a new Xcode project: **File → New → Project → iOS → App → SwiftUI**
   - Product Name: `ReadingList`
   - Bundle ID: `com.chrisrose.readinglist`
   - Minimum Deployment: iOS 26
   - Save inside the cloned repo folder (e.g. `/test/ios/`)
4. Open the project folder with Claude Code (`claude` in the terminal)
5. Sign into Claude in Xcode: **Xcode → Settings → Intelligence**
6. Claude Code writes everything from here

### Xcode + Claude Code integration
- Xcode 26.3 natively runs the Claude Agent SDK (same as Claude Code CLI)
- Sign into Claude in Xcode Intelligence settings
- Claude can write code, trigger builds, read SwiftUI previews, and iterate
- Also set up **XcodeBuildMCP** server for Claude Code CLI → Xcode build system integration

---

## Build Order

### Phase 1 — Core reader (get this working first)
1. Xcode project setup, add Supabase Swift SDK dependency
2. Auth screen — email/password login, session persistence
3. Data layer — fetch `links` and `categories` from Supabase
4. Library tab — article list with Liquid Glass cards, pull-to-refresh
5. Filter bar — status filter chips, category chips, sort (newest/stars)
6. Search — multi-token fuzzy search (same algorithm as web)
7. Article detail screen — metadata, note, star rating (tappable)
8. WebView reader — tap "Read" opens article in embedded WKWebView
9. Status changes — swipe actions and pill taps, write back to Supabase
10. Tab bar with minimize behavior

### Phase 2 — Reader + Enrich
1. Readability integration for Reader mode
2. Reader/Web toggle in article view toolbar
3. Typography controls panel (font, size, theme)
4. Foundation Models integration — Enrich button
5. Enrich review sheet — accept/dismiss per suggestion
6. Write enriched data back to Supabase

### Phase 3 — Batch + intelligence
1. Enrich All background processing
2. Triage tab — swipeable card stack
3. Natural language search via Foundation Models
4. Related articles suggestion
5. Duplicate detection

### Phase 4 — Polish & extras
1. Insights tab — reading stats, category breakdown, streaks
2. Daily digest notification
3. Home screen widget (recent saves, unread count)
4. Dynamic Island (brief confirmation flash on pull-to-refresh)
5. App icon design (Liquid Glass style)
6. Onboarding flow (explain the Shortcut-based saving workflow)

---

## Things That Could Go Wrong (and mitigations)

| Risk | Mitigation |
|---|---|
| Supabase anon key only allows reads, not writes | App authenticates with email/password — same as web admin. Supabase RLS rules should already allow authenticated writes. |
| Foundation Models not available on older iPhones | Gate all AI features with `#available`. Show "Enrich requires iPhone 15 Pro or later" gracefully. All non-AI features still work. |
| Readability parsing fails on some sites | Automatic fallback to full WebKit. User can also manually toggle to Web mode. |
| 7-day re-signing breaks the app | App data persists — re-sign just means hitting Run in Xcode. No data loss. Worth mentioning in onboarding: "If the app stops working, connect to your Mac and tap Run." |
| OG images are low quality or missing | Same fallback chain as the web: brand SVG for known domains → domain-initial gradient → no image card layout. |
| `read` and `status` get out of sync | Always set both when changing status. Rule: `read = (status == 'done')`. |
| Private links leak without auth | Default query MUST include `.eq('private', false)` unless authenticated. |

---

## Web Features NOT Being Ported (and why)

| Feature | Reason |
|---|---|
| Add/edit/delete links | Saving via Shortcut works well; editing is rare and fine on web |
| Manage categories | Admin task, web-only |
| Curate collections | Web feature for sharing — could be a Phase 5 feature |
| Admin FAB / settings panel | Not needed — app is always "authenticated" after initial login |
| View mode toggle (feed/grid) | App uses its own native card design — not replicating web layouts |

---

## Web Features That ARE Being Ported

| Feature | How |
|---|---|
| Filter by category | Scrollable chips, same categories from Supabase |
| Filter by status | Chips: All / To Read / To Try / To Share / Done |
| Sort by newest / stars | Segment control or menu |
| Multi-token fuzzy search | Same algorithm: split on whitespace, each token must appear in haystack |
| Star ratings | Tappable stars on detail screen, writes back to Supabase |
| Status changes | Swipe actions + pill on detail screen |
| Copy URL | Long-press context menu |
| Share | Long-press → iOS native share sheet |
| Note display | Shown on card preview + editable on detail screen |
| Domain favicon | Loaded from `link.favicon` or Google's favicon service fallback |

---

*Resume this work on the new Mac by pulling the repo and telling Claude Code to "start on the iOS app — read ios-app-brief.md first."*

# CLAUDE.md — Personal Website Decision Log

This file tracks architectural decisions, design choices, and customization notes.

---

## Project Overview

A personal website with multiple pages and a Supabase-backed reading list:
- `index.html` — Homepage
- `about.html` — About page
- `contact.html` — Contact page
- `uses.html` — My Gear page (hardware, software, tools)
- `reading-list.html` — Public reading list with admin CRUD, bookmarklet, compact/grid view
- `admin.html` — Admin panel for managing gear (uses.html content)
- `styles.css` — Shared stylesheet
- `reading-list.js` — Reading list logic (Supabase, filters, search, view modes)
- `uses.js` — Uses page dynamic content (gear cards)
- `admin.js` — Admin panel logic

**Hosting:** Company-managed hosting environment (not limited to GitHub Pages). Also mirrored to GitHub Pages. Can install server software.

---

## Design Decisions

### Color palette
- Background: `#ffffff` (white)
- Alternate background: `#f8f9fa` (light gray, used for section banding)
- Text: `#1a1a2e` (near-black with a subtle blue tint)
- Muted text: `#6c757d` (gray, used for `<p>` tags)
- Accent: `#4f46e5` (indigo) — used for links, buttons, tags, icons
- Accent light: `#818cf8` — hover states

**Rationale:** Indigo accent is distinctive but professional; avoids the overused
blue/teal of many developer portfolios.

### Typography
- Font: [Inter](https://rsms.me/inter/) loaded from Google Fonts
- Headings use `clamp()` for fluid sizing across viewport widths
- Letter-spacing `-0.02em` on headings for a tighter, modern feel

### Layout
- Max content width: `900px` centered — wide enough to breathe, narrow enough to
  read comfortably
- CSS Grid for card grids and two-column layouts (`about`, `contact`)
- Sticky frosted-glass nav (`backdrop-filter: blur`)

### JavaScript
The site uses vanilla JS (no frameworks, no build step). `reading-list.js`,
`uses.js`, and `admin.js` handle dynamic content. The Supabase JS v2 SDK is
loaded from CDN.

### Photo placeholder
Each page has a `<div class="photo-placeholder">` with a person SVG icon.
**To replace:** swap the `<div class="photo-placeholder">` with:
```html
<img src="images/your-photo.jpg" alt="[Your Name]" class="photo-placeholder" />
```
Add appropriate `width`/`height` and keep the `border-radius` from the CSS.

---

## Contact Form

GitHub Pages is a **static host** — it cannot process form submissions natively.

**Chosen approach:** [Formspree](https://formspree.io)
- Free tier supports 50 submissions/month
- No JavaScript required (pure HTML form POST)
- Steps to activate:
  1. Create a free account at formspree.io
  2. Create a new form and copy the endpoint ID
  3. In `contact.html`, replace `YOUR_FORM_ID` in the `action` attribute:
     ```html
     action="https://formspree.io/f/YOUR_FORM_ID"
     ```

**Alternatives considered:**
- Netlify Forms — requires hosting on Netlify instead of GitHub Pages
- EmailJS — requires adding a JS snippet; adds complexity
- Mailto link — no server processing, poor UX

---

## Cache Busting — ALWAYS DO THIS

**Every commit that changes JS or CSS must bust the browser cache.** This is handled automatically but requires two things to be in place:

### How it works

1. **`?v=TIMESTAMP` on all JS/CSS `<script>`/`<link>` tags in HTML files** — when the version changes, browsers fetch a fresh copy instead of using cached files.

2. **Git pre-commit hook** (`.git/hooks/pre-commit`) — automatically replaces all `?v=[0-9]+` occurrences in every `*.html` file with the current Unix timestamp on every commit. This runs without any manual steps.

3. **No-cache meta tags in every HTML file** — HTML files themselves can be cached by browsers, which would prevent them from seeing the new `?v=` timestamp. All HTML pages include:
   ```html
   <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
   <meta http-equiv="Pragma" content="no-cache" />
   <meta http-equiv="Expires" content="0" />
   ```

### Rules
- **Never manually edit `?v=` numbers** — the pre-commit hook handles it.
- **If adding a new JS or CSS file reference to any HTML page**, make sure it has `?v=1` on the `src`/`href` so the hook can find and update it on the next commit.
- **If adding a new HTML page**, add the three no-cache meta tags immediately after `<meta charset="UTF-8" />`.
- **Never remove the pre-commit hook** at `.git/hooks/pre-commit`.

---

## GitHub Pages / Hosting Deployment

The site is deployed from the `main` branch (or `gh-pages` branch, depending on
your repo settings).

**To enable GitHub Pages:**
1. Push all files to your repository
2. Go to **Settings → Pages** in your GitHub repo
3. Under **Source**, select the branch (e.g. `main`) and folder (`/ (root)`)
4. Save — GitHub will provide a URL like `https://yourusername.github.io/repo-name/`

**Custom domain (optional):**
- Add a `CNAME` file to the repo root containing your domain (e.g. `yourname.com`)
- Configure your DNS to point to GitHub Pages IPs (see GitHub docs)

---

## Customization Checklist

Replace all placeholder text before going live:

- [ ] `[Your Name]` — your full name (appears in nav, hero, footer, `<title>`)
- [ ] `[Your Location]` — city / country
- [ ] `[Your Role / Title]` — e.g. "Software Engineer", "Designer"
- [ ] `[Your Education]` — e.g. "B.Sc. Computer Science, MIT"
- [ ] `[A fun personal fact]` — e.g. "Runs on cold brew"
- [ ] Hero paragraph — your personal pitch
- [ ] About page paragraphs — your real story
- [ ] Skills tags — your actual skill set
- [ ] Projects section — your real projects
- [ ] Photo placeholder — your actual photo (see above)
- [ ] Social links in `contact.html` — GitHub, LinkedIn, Twitter, email
- [ ] Formspree form ID — to activate the contact form
- [ ] `<meta name="description">` on each page — for SEO

---

## Future Ideas (not yet implemented)

- Dark mode toggle (CSS `prefers-color-scheme` media query + JS toggle)
- Blog / writing section (could be a separate `blog/` directory with an index)
- Project detail pages
- Analytics (Plausible or Fathom — privacy-respecting)
- Favicon (`favicon.ico` / `<link rel="icon">`)
- Open Graph meta tags for social sharing previews

---

## File Structure

```
/
├── index.html          # Homepage
├── about.html          # About page
├── contact.html        # Contact page
├── uses.html           # My Gear page
├── reading-list.html   # Reading list (public + admin)
├── admin.html          # Gear admin panel
├── styles.css          # Shared CSS
├── reading-list.js     # Reading list logic
├── uses.js             # Uses page logic
├── admin.js            # Admin panel logic
└── CLAUDE.md           # This file — decision log

.git/hooks/pre-commit   # Auto-updates ?v= cache busters on every commit
```

---

*Last updated: 2026-03-20 by Claude Code*

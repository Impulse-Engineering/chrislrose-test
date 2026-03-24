import { Hono } from 'hono';
import type { Env } from '../types';
import { Layout } from '../components/Layout';
import { IntroOverlay } from '../components/IntroOverlay';

export const pages = new Hono<{ Bindings: Env }>();

pages.get('/', (c) => {
  const v = c.env.ASSET_VERSION;

  const introHead = (
    <>
      <link rel="stylesheet" href={`/intro.css?v=${v}`} />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    </>
  );

  const introBody = (
    <>
      <script src={`/intro.js?v=${v}`} defer></script>
      <script src={`/particles.js?v=${v}`} defer></script>
      <script src={`/cursor.js?v=${v}`} defer></script>
    </>
  );

  const html = (
    <Layout
      title="Technology Executive & Cybersecurity Leader"
      description="Chris Rose is a technology executive with over two decades of experience in cybersecurity, network operations, sales leadership, and company strategy. VP at Aseva, Santa Barbara CA."
      siteUrl={c.env.SITE_URL}
      assetVersion={v}
      currentPath="/"
      bodyClass="intro-active"
      headExtra={introHead}
      bodyExtra={introBody}
    >
      <IntroOverlay />

      {/* Hero */}
      <div class="container">
        <section class="hero">
          <div class="hero-text">
            <span class="hero-eyebrow">VP &middot; Cybersecurity &amp; Network Operations</span>
            <h1>Hi, I'm{'\n'}Chris Rose</h1>
            <p>
              A highly accomplished technology executive with over two decades of
              experience in operations management, company and product strategy,
              and high-touch customer management. Based in Santa Barbara, CA —
              helping organizations build secure, reliable infrastructure.
            </p>
            <div class="hero-cta">
              <a href="/about" class="btn btn-primary">About Me</a>
              <a href="/about#connect" class="btn btn-outline">Get in Touch</a>
            </div>
          </div>
          <div class="hero-photo">
            <img src="/images/chris-rose.jpg" alt="Chris Rose" class="photo-placeholder" />
          </div>
        </section>
      </div>

      {/* What I Do */}
      <section class="section" id="what-i-do" style="background: var(--color-bg-alt);">
        <div class="container">
          <div class="section-header">
            <span class="section-eyebrow">// expertise</span>
            <h2>What I Do</h2>
            <p>
              Twenty years of experience across cybersecurity, network operations,
              sales leadership, and technology strategy.
            </p>
          </div>
          <div class="grid-3">
            <div class="card">
              <div style="margin-bottom:1rem;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>Cybersecurity Strategy</h3>
              <p>
                Developing security programs, evaluating emerging threats, and
                guiding organizations toward risk-appropriate defenses including
                SASE, MDR, and Zero Trust frameworks.
              </p>
            </div>
            <div class="card">
              <div style="margin-bottom:1rem;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <h3>Network Operations</h3>
              <p>
                Designing and managing reliable, scalable network environments —
                from enterprise LAN/WAN to SD-WAN and cloud connectivity — aligned
                to real business requirements.
              </p>
            </div>
            <div class="card">
              <div style="margin-bottom:1rem;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Technology Leadership</h3>
              <p>
                Partnering with CIOs and IT leaders to evaluate vendors, plan
                technology deployments, build high-performing teams, and develop
                product and company strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of Expertise */}
      <section class="section" id="expertise">
        <div class="container">
          <div class="section-header">
            <span class="section-eyebrow">// focus areas</span>
            <h2>Areas of Expertise</h2>
            <p>The domains where I spend most of my time at Aseva.</p>
          </div>
          <div class="grid-3">
            <div class="card">
              <span class="tag" style="margin-bottom:0.75rem;display:inline-block;">Cybersecurity</span>
              <h3>Security Architecture</h3>
              <p>
                Zero trust frameworks, SASE deployments, MDR programs, threat
                detection, and incident response planning for midsize businesses.
              </p>
            </div>
            <div class="card">
              <span class="tag" style="margin-bottom:0.75rem;display:inline-block;">Networking</span>
              <h3>Network Infrastructure</h3>
              <p>
                Enterprise LAN/WAN, SD-WAN, cloud connectivity, and infrastructure
                reliability at scale using Cisco, Juniper, and ADTRAN solutions.
              </p>
            </div>
            <div class="card">
              <span class="tag" style="margin-bottom:0.75rem;display:inline-block;">AI &amp; Automation</span>
              <h3>Agentic AI &amp; Workflow Innovation</h3>
              <p>
                Challenging the team at Aseva to fully embrace agentic coding —
                leading an initiative where engineers are building an entire suite
                of AI-powered workflows and apps to optimize how we run the
                business, from operations to client delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="section" style="text-align: center;">
        <div class="container" style="max-width: 560px;">
          <h2>Want to Know More?</h2>
          <p style="margin: 1rem 0 2rem;">
            Get the full picture — my background, experience, and what drives
            the work I do at Aseva and beyond.
          </p>
          <a href="/about" class="btn btn-primary">About Me</a>
        </div>
      </section>
    </Layout>
  );

  return c.html(html);
});

// Placeholder routes for nav links (full implementation in Phase 3)
pages.get('/about', (c) => {
  return c.html(
    <Layout
      title="About"
      description="About Chris Rose — technology executive and cybersecurity leader."
      siteUrl={c.env.SITE_URL}
      assetVersion={c.env.ASSET_VERSION}
      currentPath="/about"
    >
      <div class="container" style="padding: 4rem 0;">
        <h1>About</h1>
        <p style="color: var(--color-text-muted);">Coming in Phase 3.</p>
      </div>
    </Layout>
  );
});

pages.get('/contact', (c) => {
  return c.html(
    <Layout
      title="Contact"
      description="Get in touch with Chris Rose."
      siteUrl={c.env.SITE_URL}
      assetVersion={c.env.ASSET_VERSION}
      currentPath="/contact"
    >
      <div class="container" style="padding: 4rem 0;">
        <h1>Contact</h1>
        <p style="color: var(--color-text-muted);">Coming in Phase 3.</p>
      </div>
    </Layout>
  );
});

pages.get('/uses', (c) => {
  return c.html(
    <Layout
      title="My Gear"
      description="Hardware, software, and tools Chris Rose uses."
      siteUrl={c.env.SITE_URL}
      assetVersion={c.env.ASSET_VERSION}
      currentPath="/uses"
    >
      <div class="container" style="padding: 4rem 0;">
        <h1>My Gear</h1>
        <p style="color: var(--color-text-muted);">Coming in Phase 3.</p>
      </div>
    </Layout>
  );
});

pages.get('/reading-list', (c) => {
  return c.html(
    <Layout
      title="Reading List"
      description="Curated articles and resources from Chris Rose."
      siteUrl={c.env.SITE_URL}
      assetVersion={c.env.ASSET_VERSION}
      ogImage="/og-reading-list.png"
      currentPath="/reading-list"
    >
      <div class="container" style="padding: 4rem 0;">
        <h1>Reading List</h1>
        <p style="color: var(--color-text-muted);">Coming in Phase 4.</p>
      </div>
    </Layout>
  );
});

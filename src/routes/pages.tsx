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

pages.get('/about', (c) => {
  const v = c.env.ASSET_VERSION;

  const aboutHead = (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    </>
  );

  const aboutBody = (
    <script src={`/animations.js?v=${v}`} defer></script>
  );

  return c.html(
    <Layout
      title="About — Chris Rose"
      description="Chris Rose is a technology executive with over two decades of experience in cybersecurity, network operations, and sales leadership. VP at Aseva (formerly Impulse Advanced Communications), Santa Barbara CA."
      siteUrl={c.env.SITE_URL}
      assetVersion={v}
      currentPath="/about"
      headExtra={aboutHead}
      bodyExtra={aboutBody}
    >
      <div class="container">
        <section class="section">

          <div class="section-header anim-fade-up">
            <span class="section-eyebrow">// about</span>
            <h2>Background &amp; Experience</h2>
          </div>

          <div class="about-layout">

            {/* Photo Sidebar */}
            <div class="about-photo-wrap anim-fade-up">
              <img src="/images/chris-rose.jpg" alt="Chris Rose" class="photo-placeholder" />

              {/* Quick Facts */}
              <div class="card" style="margin-top:1.5rem;">
                <h3 style="margin-bottom:1rem;font-size:0.9rem;font-family:var(--font-mono);letter-spacing:0.06em;text-transform:uppercase;">Quick Facts</h3>
                <ul style="list-style:none;display:flex;flex-direction:column;gap:0.6rem;">
                  <li style="display:flex;gap:0.5rem;font-size:0.875rem;">
                    <span>📍</span>
                    <span style="color:var(--color-text-muted);">Santa Barbara, CA</span>
                  </li>
                  <li style="display:flex;gap:0.5rem;font-size:0.875rem;">
                    <span>💼</span>
                    <span style="color:var(--color-text-muted);">VP, Cybersecurity &amp; Network Ops — Aseva</span>
                  </li>
                  <li style="display:flex;gap:0.5rem;font-size:0.875rem;">
                    <span>🎓</span>
                    <span style="color:var(--color-text-muted);">B.S. Business Economics, UC Santa Barbara</span>
                  </li>
                  <li style="display:flex;gap:0.5rem;font-size:0.875rem;">
                    <span>🏆</span>
                    <span style="color:var(--color-text-muted);">Pacific Coast Business Times "40 Under 40"</span>
                  </li>
                  <li style="display:flex;gap:0.5rem;font-size:0.875rem;">
                    <span>📅</span>
                    <span style="color:var(--color-text-muted);">20+ years in tech leadership</span>
                  </li>
                </ul>
              </div>

              <div style="margin-top:1.5rem;">
                <a href="#connect" class="btn btn-primary" style="width:100%;justify-content:center;">Get in Touch</a>
              </div>
            </div>

            {/* Main Content */}
            <div class="about-content">
              <h2>Background</h2>
              <p>Chris Rose is a technology executive with over two decades of experience in operations management, company and product strategy, and high-touch customer management. He currently serves as Vice President of Cybersecurity and Network Operations at Aseva — a Santa Barbara–based technology services company he helped transform through a full rebrand in October 2025.</p>
              <p>Throughout his career, Chris has worked alongside CIOs, IT directors, and business leaders to plan and deploy modern network and security environments. His approach combines deep technical knowledge with a proven ability to lead sales teams, manage vendor partnerships, and drive measurable revenue growth.</p>

              <h2>At Aseva</h2>
              <p>Chris leads teams responsible for network operations, client services, and cybersecurity strategy. He formulated and executed the company's product pivot toward cybersecurity sales and support — a transformation that included identifying new technology partners, redesigning the brand, and building new go-to-market strategies.</p>
              <p>A hallmark of his approach: he established a private lounge in downtown Santa Barbara to connect with IT professionals, leading to direct conversations with over 50 CIOs and IT Directors. This community-first mindset is core to how Aseva operates.</p>

              {/* Skills Section */}
              <h2 id="skills">Skills &amp; Expertise</h2>
              <p>Leadership and business capabilities developed across 20+ years:</p>

              <div class="skills-cloud" style="margin-bottom:2rem;">
                {/* Tier 1: Featured (largest) */}
                <span class="skill-pill skill-pill-lg">Executive Leadership</span>
                <span class="skill-pill skill-pill-lg">Cybersecurity</span>
                <span class="skill-pill skill-pill-lg">Sales Management</span>
                {/* Tier 2: Standard */}
                <span class="skill-pill skill-pill-md">Account Management</span>
                <span class="skill-pill skill-pill-md">Product Management</span>
                <span class="skill-pill skill-pill-md">Network Design</span>
                <span class="skill-pill skill-pill-md">Public Speaking</span>
                <span class="skill-pill skill-pill-md">Contract Negotiation</span>
                <span class="skill-pill skill-pill-md">Vendor Management</span>
                <span class="skill-pill skill-pill-md">Event Management</span>
                {/* Tier 3: Minor */}
                <span class="skill-pill skill-pill-sm">Pricing Strategy</span>
                <span class="skill-pill skill-pill-sm">Tech Demos</span>
                <span class="skill-pill skill-pill-sm">Troubleshooting</span>
                <span class="skill-pill skill-pill-sm">CRM (Salesforce)</span>
                <span class="skill-pill skill-pill-sm">KPI Development</span>
              </div>

              <p>Vendor &amp; technology knowledge:</p>

              <div class="tech-stack-grid" style="margin-bottom:2.5rem;">
                <div class="tech-card anim-fade-up">
                  <span class="tech-card-label">SASE</span>
                  <div class="vendor-tags">
                    <span class="vendor-tag">Cato Networks</span>
                    <span class="vendor-tag">Cloudflare</span>
                    <span class="vendor-tag">Zscaler</span>
                  </div>
                </div>
                <div class="tech-card anim-fade-up">
                  <span class="tech-card-label">MDR / Security</span>
                  <div class="vendor-tags">
                    <span class="vendor-tag">eSentire</span>
                    <span class="vendor-tag">ArcticWolf</span>
                    <span class="vendor-tag">BlueVoyant</span>
                    <span class="vendor-tag">Endpoint Protection</span>
                  </div>
                </div>
                <div class="tech-card anim-fade-up">
                  <span class="tech-card-label">Networking Hardware</span>
                  <div class="vendor-tags">
                    <span class="vendor-tag">Cisco</span>
                    <span class="vendor-tag">Juniper</span>
                    <span class="vendor-tag">ADTRAN</span>
                    <span class="vendor-tag">Enterprise Broadband</span>
                  </div>
                </div>
                <div class="tech-card anim-fade-up">
                  <span class="tech-card-label">SD-WAN</span>
                  <div class="vendor-tags">
                    <span class="vendor-tag">128 Technology</span>
                    <span class="vendor-tag">VeloCloud</span>
                    <span class="vendor-tag">Juniper</span>
                  </div>
                </div>
                <div class="tech-card anim-fade-up">
                  <span class="tech-card-label">Collaboration &amp; AI</span>
                  <div class="vendor-tags">
                    <span class="vendor-tag">Cisco Webex</span>
                    <span class="vendor-tag">MS Teams</span>
                    <span class="vendor-tag">Broadsoft UCaaS</span>
                    <span class="vendor-tag">ChatGPT</span>
                    <span class="vendor-tag">Copilot</span>
                    <span class="vendor-tag">Apple / iOS</span>
                    <span class="vendor-tag">Claude Code</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* Career Timeline — full width section */}
      <section class="section" id="career-timeline" style="background: var(--color-bg-alt);">
        <div class="container">
          <div class="section-header anim-fade-up">
            <span class="section-eyebrow">// career</span>
            <h2>Career Timeline</h2>
            <p>Over two decades building technology businesses and leading teams on the Central Coast of California.</p>
          </div>

          <div class="timeline">

            {/* Entry 1: Current VP at Aseva */}
            <div class="timeline-entry anim-fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Rebranded to Aseva · Oct 2025 (led by Chris)
                </div>
                <div class="timeline-role">Vice President</div>
                <div class="timeline-meta">
                  <span class="timeline-meta-company">Aseva</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Santa Barbara, CA</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Jan 2022 – Present</span>
                </div>
                <ul class="timeline-achievements">
                  <li>Formulated and executed company product strategies, including a pivot toward cybersecurity sales and support — directly contributing to a 15% increase in total company revenue.</li>
                  <li>Managed technical teams including Service Implementation, Network Operations, and TAC; developed KPIs and eliminated departmental silos.</li>
                  <li>Spearheaded discovery of new technology vendors and partners — evaluated and integrated SASE, MDR, and SD-WAN solutions into the product portfolio.</li>
                  <li>Established a private lounge in downtown Santa Barbara to connect with IT professionals, leading to meetings with over 50 CIOs and IT Directors.</li>
                  <li>Led the full company rebrand from Impulse Advanced Communications to Aseva in October 2025, including a new brandbook, website, and marketing materials.</li>
                </ul>
              </div>
            </div>

            {/* Entry 2: VP Client Services */}
            <div class="timeline-entry anim-fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-role">VP, Client Services</div>
                <div class="timeline-meta">
                  <span class="timeline-meta-company">Impulse Advanced Communications</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Santa Barbara, CA</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Jan 2015 – Jan 2022</span>
                </div>
                <ul class="timeline-achievements">
                  <li>Oversaw the management of Client Services and Sales teams, driving sales, customer satisfaction, and retention for a growing portfolio of enterprise clients.</li>
                  <li>Played a key role in product development, launching hosted PBX services via Broadsoft and integrating Webex into the UCaaS system.</li>
                  <li>Managed the product catalog — overseeing all product pricing and negotiating vendor contracts across the full portfolio.</li>
                  <li>Cultivated and maintained strong relationships with senior CIOs and IT directors across the client base.</li>
                </ul>
              </div>
            </div>

            {/* Entry 3: Director of Sales */}
            <div class="timeline-entry anim-fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-role">Director of Sales</div>
                <div class="timeline-meta">
                  <span class="timeline-meta-company">Impulse Advanced Communications</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Santa Barbara, CA</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Jan 2006 – Jan 2015</span>
                </div>
                <ul class="timeline-achievements">
                  <li>Developed and implemented sales strategies to expand market reach and increase revenue.</li>
                  <li>Actively led the successful launch of a hosted VoIP service, contributing to a substantial 45% revenue increase.</li>
                  <li>Expanded the company's geographic reach by opening offices in San Luis Obispo, Ventura, and Santa Monica.</li>
                  <li>Led and trained sales teams to improve performance and consistently achieve targets.</li>
                </ul>
              </div>
            </div>

            {/* Entry 4: Sales Director at Netlojix */}
            <div class="timeline-entry anim-fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-role">Sales Director</div>
                <div class="timeline-meta">
                  <span class="timeline-meta-company">Netlojix</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Santa Barbara, CA</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Jan 2004 – Jan 2006</span>
                </div>
                <ul class="timeline-achievements">
                  <li>Oversaw sales operations, setting and achieving sales targets across the organization.</li>
                  <li>Increased client base by 30% through targeted sales initiatives and strategic account development.</li>
                  <li>Improved sales team productivity by implementing Salesforce.com CRM — a transformative change for the team's workflow and pipeline visibility.</li>
                </ul>
              </div>
            </div>

            {/* Entry 5: Sales Executive */}
            <div class="timeline-entry anim-fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-role">Sales Executive</div>
                <div class="timeline-meta">
                  <span class="timeline-meta-company">Netlojix</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>Santa Barbara, CA</span>
                  <span class="timeline-meta-sep">·</span>
                  <span>May 2002 – Jan 2004</span>
                </div>
                <ul class="timeline-achievements">
                  <li>Launched a sales career by prospecting and closing broadband and hosting services to businesses on the Central Coast of California.</li>
                  <li>Negotiated contracts, conducted product demonstrations, and successfully built a client base from the ground up.</li>
                  <li>Developed the foundational skills in consultative selling, relationship management, and technical product knowledge that would define a 20+ year career.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Achievement Spotlight */}
      <section class="section" id="recognition" style="background: var(--color-bg);">
        <div class="container">
          <div class="section-header anim-fade-up">
            <span class="section-eyebrow">// recognition</span>
            <h2>Achievement Spotlight</h2>
          </div>

          <div class="achievement-grid">

            {/* Tile 1: Award */}
            <div class="achievement-tile achievement-tile-award anim-fade-up">
              <div class="achievement-icon-wrap">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div class="achievement-headline"><span class="award-scramble-num">40</span> Under 40</div>
              <div class="achievement-subline">Pacific Coast Business Times</div>
              <div class="achievement-label">Santa Barbara, CA</div>
            </div>

            {/* Tile 2: Years in Tech */}
            <div class="achievement-tile anim-fade-up">
              <div class="achievement-number" data-counter-to="20" data-counter-suffix="+">0</div>
              <div class="achievement-headline">Years in Tech</div>
              <div class="achievement-subline">Sales → VP · 2002 to present</div>
              <div class="achievement-label">Central Coast, California</div>
            </div>

            {/* Tile 3: CIOs Met */}
            <div class="achievement-tile anim-fade-up">
              <div class="achievement-number" data-counter-to="50" data-counter-suffix="+">0</div>
              <div class="achievement-headline">CIOs &amp; IT Directors</div>
              <div class="achievement-subline">Met personally in Santa Barbara</div>
              <div class="achievement-label">Via private lounge — Aseva</div>
            </div>

          </div>
        </div>
      </section>

      {/* Connect */}
      <section class="section" id="connect" style="background: var(--color-bg-alt);">
        <div class="container">
          <div class="section-header anim-fade-up" style="margin-bottom:2.5rem;">
            <span class="section-eyebrow">// connect</span>
            <h2>Get In Touch</h2>
            <p>Open to conversations about technology strategy, cybersecurity, network operations, or potential partnerships. I typically respond within 1–2 business days.</p>
          </div>
          <div class="connect-grid">

            <a class="connect-card anim-fade-up" href="mailto:crose@aseva.com">
              <div class="connect-signal"></div>
              <div class="connect-card-channel">// email</div>
              <div class="connect-card-value">crose@aseva.com</div>
              <div class="connect-card-action">Compose message <span class="connect-arrow">→</span></div>
            </a>

            <a class="connect-card anim-fade-up" href="https://www.linkedin.com/in/chrislrose" target="_blank" rel="noopener noreferrer">
              <div class="connect-signal"></div>
              <div class="connect-card-channel">// linkedin</div>
              <div class="connect-card-value">in/chrislrose</div>
              <div class="connect-card-action">View profile <span class="connect-arrow">→</span></div>
            </a>

            <a class="connect-card anim-fade-up" href="tel:+18058846368">
              <div class="connect-signal"></div>
              <div class="connect-card-channel">// phone</div>
              <div class="connect-card-value">805-884-6368</div>
              <div class="connect-card-action">Call direct <span class="connect-arrow">→</span></div>
            </a>

          </div>
        </div>
      </section>
    </Layout>
  );
});

pages.get('/contact', (c) => {
  const v = c.env.ASSET_VERSION;

  const contactHead = (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    </>
  );

  const contactBody = (
    <script src={`/animations.js?v=${v}`} defer></script>
  );

  return c.html(
    <Layout
      title="Contact — Chris Rose"
      description="Get in touch with Chris Rose — technology executive, VP of Cybersecurity and Network Operations at Aseva, Santa Barbara CA."
      siteUrl={c.env.SITE_URL}
      assetVersion={v}
      currentPath="/contact"
      headExtra={contactHead}
      bodyExtra={contactBody}
    >
      <div class="container">
        <section class="section">

          <div class="section-header anim-fade-up">
            <span class="section-eyebrow">// contact</span>
            <h2>Let's Connect</h2>
          </div>

          <div class="contact-layout">

            {/* Contact Info */}
            <div class="contact-info anim-fade-up">
              <p>I'm always open to conversations about technology strategy, cybersecurity, network operations, or potential partnerships. Reach out through any of the channels below.</p>

              <div class="contact-links">
                {/* Email */}
                <a href="mailto:crose@aseva.com" class="contact-link">
                  <div class="contact-link-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  crose@aseva.com
                </a>

                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/chrislrose" class="contact-link" target="_blank" rel="noopener">
                  <div class="contact-link-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </div>
                  linkedin.com/in/chrislrose
                </a>

                {/* Phone */}
                <a href="tel:+18058846368" class="contact-link">
                  <div class="contact-link-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  805-884-6368
                </a>
              </div>

              <p style="margin-top:2rem;font-size:0.85rem;">
                I typically respond within 1–2 business days.
              </p>
            </div>

            {/* Contact Form */}
            <form
              class="contact-form anim-fade-up"
              action="https://formspree.io/f/YOUR_FORM_ID"
              method="post"
            >
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Jane Smith" required autocomplete="name" />
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="jane@example.com" required autocomplete="email" />
              </div>

              <div class="form-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject" name="subject" placeholder="What's this about?" />
              </div>

              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" placeholder="Tell me what's on your mind…" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">
                Send Message
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

          </div>
        </section>
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

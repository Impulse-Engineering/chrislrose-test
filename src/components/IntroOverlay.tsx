import type { FC } from 'hono/jsx';

export const IntroOverlay: FC = () => {
  return (
    <div id="intro-overlay">
      {/* Matrix rain canvas (background layer) */}
      <canvas id="intro-matrix-canvas"></canvas>

      {/* Matrix dive canvas (3D fly-through on blue pill) */}
      <canvas id="intro-dive-canvas"></canvas>

      {/* Glitch flash layer */}
      <div class="intro-glitch-flash"></div>

      {/* Happy Mac pixel art (SVG) */}
      <div class="intro-happy-mac">
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="2" width="16" height="22" rx="2" fill="#fff" />
          <rect x="10" y="4" width="12" height="12" fill="#000" />
          <rect x="12" y="7" width="2" height="2" fill="#fff" />
          <rect x="18" y="7" width="2" height="2" fill="#fff" />
          <rect x="15" y="10" width="2" height="1" fill="#fff" />
          <rect x="12" y="12" width="2" height="1" fill="#fff" />
          <rect x="13" y="13" width="6" height="1" fill="#fff" />
          <rect x="18" y="12" width="2" height="1" fill="#fff" />
          <rect x="10" y="18" width="12" height="2" fill="#ccc" />
          <rect x="13" y="19" width="6" height="1" fill="#999" />
          <rect x="11" y="24" width="10" height="2" rx="1" fill="#ddd" />
          <rect x="14" y="22" width="4" height="2" fill="#ccc" />
        </svg>
      </div>

      {/* "hello" in classic Mac cursive */}
      <svg class="intro-hello-svg" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M 151.5 129.8 C 219.3,103.3 190.5,118.8 219.3,103.3 C 241.6,91.4 253.2,75.4 244.3,68.6 C 211.8,43.5 192.5,134.8 197.2,134.8 C 201.9,134.8 201.6,108.2 225.5,102.2 C 249.4,96.2 257.8,104.2 258.9,108.0 C 260.7,114.0 253.5,123.6 254.7,127.1 C 259.8,141.7 342.3,127.4 348.8,110.8 C 355.8,93.0 294.6,93.8 306.7,122.3 C 311.2,132.8 338.8,135.4 353.4,133.9 C 406.5,128.2 442.9,99.3 441.6,77.1 C 439.9,48.4 382.8,77.5 396.6,121.7 C 401.9,138.8 446.7,133.2 460.0,128.7 C 484.5,120.3 527.7,96.1 519.8,72.6 C 511.6,48.1 449.4,88.5 478.0,125.2 C 487.5,137.5 516.0,133.3 523.8,131.4 C 542.4,127.0 548.4,110.7 563.8,103.6 C 583.2,94.7 613.9,101.4 615.2,112.0 C 618.0,135.5 577.3,135.5 562.1,130.2 C 549.0,125.6 546.0,112.0 563.6,103.6 C 575.6,97.9 594.9,97.7 620.2,104.2 C 630.6,106.8 639.5,106.4 646.5,102.1" />
      </svg>

      {/* Matrix wake-up text */}
      <div class="intro-wake-text"></div>

      {/* Red pill / Blue pill choice */}
      <div class="intro-pills">
        <button class="intro-pill intro-pill--red" type="button">
          <span class="intro-pill-circle"></span>
          Stay in the Matrix
        </button>
        <button class="intro-pill intro-pill--blue" type="button">
          <span class="intro-pill-circle"></span>
          Enter the site
        </button>
      </div>

      {/* 90s internet chaos (red pill easter egg) */}
      <div class="intro-chaos" style="display:none;">
        <div class="intro-chaos-bg"></div>
        <div class="intro-chaos-banner">&#127881; Congratulations!!! &#127881;</div>
        <div class="intro-chaos-visitor">&#11088; You are the 1,000,000th visitor! &#11088;</div>
        <div class="intro-chaos-popup">
          <div class="intro-chaos-popup-titlebar">&#9888;&#65039; Important Message</div>
          <div class="intro-chaos-popup-body">
            CLICK HERE to claim your FREE prize! &#128433;
          </div>
        </div>
        <div class="intro-chaos-marquee">
          <span>&#128679; Under Construction &#128679; Best viewed in Netscape Navigator &#128679; Sign my guestbook! &#128679; Made with MS FrontPage &#128679;</span>
        </div>
        <div class="intro-chaos-counter">
          You are visitor #000,042
        </div>
        <div class="intro-chaos-exit"></div>
      </div>

      {/* Skip prompt */}
      <div class="intro-skip">Press any key to skip</div>
    </div>
  );
};

/*!
 * intro.js — Animated intro: Classic Mac '84 boot → Matrix pill choice → site reveal
 * Requires: gsap.min.js (loaded before this script)
 * ~5 second sequence. Always plays with skip support. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  // ── Guard: reduced motion → skip entirely ──────────────────
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!motionOK) {
    var overlay = document.getElementById('intro-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('intro-active');
    window.introComplete = true;
    window.dispatchEvent(new CustomEvent('intro-done'));
    return;
  }

  // ── State ──────────────────────────────────────────────────
  var skipped = false;
  var finished = false;
  var tl = null; // master GSAP timeline

  // ── DOM refs ───────────────────────────────────────────────
  var overlay       = document.getElementById('intro-overlay');
  if (!overlay) return;

  var happyMac      = overlay.querySelector('.intro-happy-mac');
  var helloSvg      = overlay.querySelector('.intro-hello-svg');
  var wakeText      = overlay.querySelector('.intro-wake-text');
  var pills         = overlay.querySelector('.intro-pills');
  var pillRed       = overlay.querySelector('.intro-pill--red');
  var pillBlue      = overlay.querySelector('.intro-pill--blue');
  var skipEl        = overlay.querySelector('.intro-skip');
  var matrixCanvas  = document.getElementById('intro-matrix-canvas');
  var diveCanvas    = document.getElementById('intro-dive-canvas');
  var glitchFlash   = overlay.querySelector('.intro-glitch-flash');

  // ── Matrix rain (intro-specific, smaller scale) ────────────
  var matCtx, matDrops, matCols, matRaf;

  function initIntroMatrix() {
    if (!matrixCanvas) return;
    matCtx = matrixCanvas.getContext('2d');
    matrixCanvas.width  = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    matCols = Math.floor(window.innerWidth / 18);
    matDrops = [];
    for (var i = 0; i < matCols; i++) {
      matDrops.push(Math.random() * -40 | 0); // stagger start positions
    }
  }

  function drawIntroMatrix() {
    matCtx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    matCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    matCtx.fillStyle = '#00ff41';
    matCtx.font = '15px "JetBrains Mono", monospace';

    for (var i = 0; i < matDrops.length; i++) {
      if (matDrops[i] > 0) {
        var char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        matCtx.fillText(char, i * 18, matDrops[i] * 18);
      }
      if (matDrops[i] * 18 > matrixCanvas.height && Math.random() > 0.975) {
        matDrops[i] = 0;
      }
      matDrops[i]++;
    }
    matRaf = requestAnimationFrame(drawIntroMatrix);
  }

  function startIntroMatrix() {
    initIntroMatrix();
    drawIntroMatrix();
  }

  function stopIntroMatrix() {
    if (matRaf) { cancelAnimationFrame(matRaf); matRaf = null; }
  }

  // ── "hello" SVG path draw animation ────────────────────────
  function animateHelloPath(duration) {
    if (!helloSvg) return;
    var path = helloSvg.querySelector('path');
    if (!path) return;
    var len = path.getTotalLength();
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;

    gsap.to(helloSvg, { opacity: 1, duration: 0.01 });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: duration || 1.8,
      ease: 'power2.inOut'
    });
  }

  // ── Typewriter for wake text ───────────────────────────────
  function typeText(el, text, speed, callback) {
    var i = 0;
    el.textContent = '';
    gsap.to(el, { opacity: 1, duration: 0.01 });

    function tick() {
      if (skipped) { el.textContent = text; if (callback) callback(); return; }
      i++;
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        setTimeout(tick, speed);
      } else {
        if (callback) callback();
      }
    }
    tick();
  }

  // ── 3D Matrix dive (fly-through code columns) ─────────────
  // Inspired by The Matrix (1999) opening title sequence where
  // the camera zooms through cascading green code.
  var diveCtx, diveRaf, diveColumns, diveStartTime;
  var DIVE_DURATION = 3200; // ms total dive animation

  function initDive() {
    if (!diveCanvas) return;
    diveCtx = diveCanvas.getContext('2d');
    diveCanvas.width  = window.innerWidth;
    diveCanvas.height = window.innerHeight;

    var w = diveCanvas.width;
    var h = diveCanvas.height;
    var cx = w / 2;
    var cy = h / 2;

    // Create columns of code at different 3D depths
    diveColumns = [];
    var numColumns = 120;
    for (var i = 0; i < numColumns; i++) {
      // Spread columns in a circle around center, at various depths
      var angle = Math.random() * Math.PI * 2;
      var radius = 30 + Math.random() * 250;
      diveColumns.push({
        // 2D position offset from center (in "world" coords)
        wx: Math.cos(angle) * radius,
        wy: Math.sin(angle) * radius,
        // Depth (z) — starts far away, rushes toward camera
        z: 200 + Math.random() * 800,
        // Each column has its own set of characters
        chars: [],
        charCount: 8 + Math.floor(Math.random() * 16),
        speed: 0.5 + Math.random() * 1.5, // character scroll speed
        offset: Math.random() * 100
      });

      // Pre-generate characters for each column
      var col = diveColumns[diveColumns.length - 1];
      for (var j = 0; j < col.charCount; j++) {
        col.chars.push({
          ch: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
          brightness: Math.random()
        });
      }
    }

    diveStartTime = performance.now();
  }

  function drawDive(now) {
    var elapsed = now - diveStartTime;
    var progress = Math.min(elapsed / DIVE_DURATION, 1);

    var w = diveCanvas.width;
    var h = diveCanvas.height;
    var cx = w / 2;
    var cy = h / 2;

    // Gradually darken trail — faster fade at start, slower at end for streaks
    var trailAlpha = 0.12 + progress * 0.15;
    diveCtx.fillStyle = 'rgba(0, 0, 0, ' + trailAlpha + ')';
    diveCtx.fillRect(0, 0, w, h);

    // Camera speed accelerates (easeIn)
    var camSpeed = 0.3 + progress * progress * 4.0;

    // Vignette / radial glow at center as we approach end
    if (progress > 0.6) {
      var glowAlpha = (progress - 0.6) / 0.4 * 0.3;
      var grad = diveCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      grad.addColorStop(0, 'rgba(0, 255, 65, ' + glowAlpha + ')');
      grad.addColorStop(0.3, 'rgba(0, 255, 65, ' + (glowAlpha * 0.3) + ')');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      diveCtx.fillStyle = grad;
      diveCtx.fillRect(0, 0, w, h);
    }

    for (var i = 0; i < diveColumns.length; i++) {
      var col = diveColumns[i];

      // Move column toward camera (decrease z)
      col.z -= camSpeed * (1 + col.speed);

      // If column passed camera, respawn it far away
      if (col.z <= 1) {
        col.z = 600 + Math.random() * 400;
        var angle = Math.random() * Math.PI * 2;
        var radius = 30 + Math.random() * 250;
        col.wx = Math.cos(angle) * radius;
        col.wy = Math.sin(angle) * radius;
        // Randomize characters
        for (var r = 0; r < col.chars.length; r++) {
          col.chars[r].ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        }
      }

      // Project 3D → 2D (perspective)
      var perspective = 300 / col.z;
      var sx = cx + col.wx * perspective;
      var sy = cy + col.wy * perspective;

      // Size scales with perspective
      var fontSize = Math.max(6, Math.min(28, 14 * perspective));

      // Brightness based on depth — closer = brighter
      var depthBright = Math.min(1, perspective * 1.5);

      // Cycle characters occasionally
      if (Math.random() < 0.03) {
        var ri = Math.floor(Math.random() * col.chars.length);
        col.chars[ri].ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
      }

      diveCtx.font = fontSize + 'px "JetBrains Mono", monospace';
      diveCtx.textAlign = 'center';

      // Draw each character in the column vertically
      var charSpacing = fontSize * 1.2;
      var scrollOffset = (elapsed * 0.002 * col.speed + col.offset) % col.charCount;

      for (var j = 0; j < col.charCount; j++) {
        var ci = (j + Math.floor(scrollOffset)) % col.charCount;
        var charY = sy + (j - col.charCount / 2) * charSpacing * perspective * 0.5;

        // Skip if off screen
        if (charY < -20 || charY > h + 20 || sx < -20 || sx > w + 20) continue;

        var bright = depthBright * col.chars[ci].brightness;

        // Lead character (brightest) is white-green, rest are green
        if (j === 0) {
          var wb = Math.min(1, bright * 1.5);
          diveCtx.fillStyle = 'rgba(180, 255, 180, ' + wb + ')';
          diveCtx.shadowColor = '#00ff41';
          diveCtx.shadowBlur = 8;
        } else {
          var g = Math.floor(100 + bright * 155);
          diveCtx.fillStyle = 'rgba(0, ' + g + ', 65, ' + bright + ')';
          diveCtx.shadowColor = 'transparent';
          diveCtx.shadowBlur = 0;
        }

        diveCtx.fillText(col.chars[ci].ch, sx, charY);
      }
      diveCtx.shadowBlur = 0;
    }

    // Final flash as we "arrive"
    if (progress >= 0.92) {
      var flashAlpha = (progress - 0.92) / 0.08;
      diveCtx.fillStyle = 'rgba(255, 255, 255, ' + (flashAlpha * flashAlpha) + ')';
      diveCtx.fillRect(0, 0, w, h);
    }

    if (progress < 1) {
      diveRaf = requestAnimationFrame(drawDive);
    } else {
      // Dive complete — reveal site
      revealSite();
    }
  }

  function startDive() {
    initDive();
    gsap.to(diveCanvas, { opacity: 1, duration: 0.3 });
    diveRaf = requestAnimationFrame(drawDive);
  }

  function stopDive() {
    if (diveRaf) { cancelAnimationFrame(diveRaf); diveRaf = null; }
  }

  // ── Reveal site (called after dive or directly for red pill) ──
  function revealSite() {
    stopDive();
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: function () {
        overlay.classList.add('intro-hidden');
        document.body.classList.remove('intro-active');
        window.introComplete = true;
        window.dispatchEvent(new CustomEvent('intro-done'));
      }
    });
  }

  // ── Finish / reveal site ───────────────────────────────────
  function finishIntro(chosenPill) {
    if (finished) return;
    finished = true;
    stopIntroMatrix();

    if (chosenPill === 'blue') {
      // Hide pills and wake text, then launch the 3D dive
      gsap.to([wakeText, pills], { opacity: 0, duration: 0.3 });

      // Intensify the 2D rain briefly before dive takes over
      if (matrixCanvas) {
        gsap.to(matrixCanvas, { opacity: 0.5, duration: 0.3 });
      }

      setTimeout(function () {
        // Kill 2D rain, start 3D dive
        stopIntroMatrix();
        if (matrixCanvas) gsap.to(matrixCanvas, { opacity: 0, duration: 0.4 });
        startDive();
      }, 400);

    } else {
      // Red pill path — same as before (chaos sequence handles its own exit)
      var exitDelay = 600;

      if (glitchFlash) {
        gsap.to(glitchFlash, {
          opacity: 0.8,
          duration: 0.08,
          yoyo: true,
          repeat: 3,
          ease: 'steps(1)'
        });
      }

      setTimeout(function () {
        revealSite();
      }, exitDelay);
    }
  }

  // ── Skip handler (active only before pills appear) ─────────
  var skipEnabled = true;

  function skip() {
    if (finished || !skipEnabled) return;
    skipped = true;
    if (tl) tl.progress(1);
    // Skip goes straight to site — no dive animation
    finished = true;
    stopIntroMatrix();
    stopDive();
    revealSite();
  }

  function disableSkip() {
    skipEnabled = false;
    if (skipEl) gsap.to(skipEl, { opacity: 0, duration: 0.3 });
  }

  // Skip on any key or click/tap (disabled once pills show)
  document.addEventListener('keydown', function onSkipKey(e) {
    if (!finished && !overlay.classList.contains('intro-hidden') && skipEnabled) {
      if (e.target.classList && e.target.classList.contains('intro-pill')) return;
      skip();
      document.removeEventListener('keydown', onSkipKey);
    }
  });

  if (skipEl) {
    skipEl.addEventListener('click', skip);
  }

  // ── 90s internet chaos (red pill easter egg) ──────────────
  function runChaosSequence() {
    var chaosDiv    = overlay.querySelector('.intro-chaos');
    var chaosBg     = overlay.querySelector('.intro-chaos-bg');
    var banner      = overlay.querySelector('.intro-chaos-banner');
    var visitor     = overlay.querySelector('.intro-chaos-visitor');
    var popup       = overlay.querySelector('.intro-chaos-popup');
    var marquee     = overlay.querySelector('.intro-chaos-marquee');
    var counter     = overlay.querySelector('.intro-chaos-counter');
    var exitText    = overlay.querySelector('.intro-chaos-exit');

    if (!chaosDiv) { finishIntro('red'); return; }

    // Hide current intro elements
    gsap.to([wakeText, pills], { opacity: 0, duration: 0.2 });

    // Show chaos container
    chaosDiv.style.display = 'flex';
    gsap.to(chaosBg, { opacity: 1, duration: 0.3 });

    // Stagger in the chaos elements
    gsap.to(banner,  { opacity: 1, duration: 0.01, delay: 0.3 });
    gsap.to(visitor, { opacity: 1, duration: 0.01, delay: 0.7 });
    gsap.to(popup,   { opacity: 1, duration: 0.01, delay: 1.1 });
    gsap.to(marquee, { opacity: 1, duration: 0.01, delay: 1.5 });
    gsap.to(counter, { opacity: 1, duration: 0.01, delay: 1.8 });

    // After chaos plays, show the exit message
    setTimeout(function () {
      typeText(exitText, '...you can\'t stay here. Welcome to reality.', 45, function () {
        setTimeout(function () { finishIntro('red'); }, 800);
      });
    }, 2800);
  }

  // ── Pill click handlers ────────────────────────────────────
  if (pillBlue) {
    pillBlue.addEventListener('click', function () {
      if (finished) return;
      pillBlue.classList.add('intro-pill--glow');
      finishIntro('blue');
    });
  }

  if (pillRed) {
    pillRed.addEventListener('click', function () {
      if (finished) return;
      pillRed.classList.add('intro-pill--glow');
      runChaosSequence();
    });
  }

  // ── Master timeline ────────────────────────────────────────
  function runIntro() {
    tl = gsap.timeline();

    // Phase 1: Classic Mac boot (~0 – 3s)
    // Happy Mac appears
    tl.to(happyMac, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 0.5);

    // Small scale-in bounce for Happy Mac
    tl.from(happyMac, {
      scale: 0.7,
      duration: 0.7,
      ease: 'back.out(1.7)'
    }, 0.5);

    // "hello" draws in (starts at 1.2s, takes 1.8s to draw)
    tl.call(function () {
      animateHelloPath(1.8);
    }, null, 1.2);

    // Show skip text
    if (skipEl) {
      tl.to(skipEl, { opacity: 1, duration: 0.3 }, 1.0);
    }

    // ── Pause: let "hello" breathe (~3.0 – 4.2s) ──────────

    // Phase 2: Matrix wake-up (~4.2 – 6s)
    // Fade out Mac elements slightly and start transition
    tl.to([happyMac], {
      opacity: 0.2,
      duration: 0.6,
      ease: 'power1.in'
    }, 4.2);

    // Hello stroke turns green
    tl.to(helloSvg ? helloSvg.querySelector('path') : [], {
      stroke: '#00ff41',
      duration: 0.5,
      ease: 'power1.in'
    }, 4.2);

    // Subtle matrix rain starts in background
    tl.call(function () {
      if (matrixCanvas) {
        startIntroMatrix();
        gsap.to(matrixCanvas, { opacity: 0.15, duration: 0.8 });
      }
    }, null, 4.5);

    // Wake text types
    tl.call(function () {
      typeText(wakeText, 'Wake up, Chris...', 65);
    }, null, 4.8);

    // Phase 3: The Choice (~6 – 7.5s)
    // Hello fades out
    tl.to(helloSvg, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: 'power1.in'
    }, 6.0);

    // Happy Mac fades out
    tl.to(happyMac, {
      opacity: 0,
      duration: 0.4,
    }, 6.0);

    // Pills appear — disable skip so user must choose
    tl.call(disableSkip, null, 6.5);

    tl.to(pills, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 6.5);

    tl.from(pills.children, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.2,
      ease: 'power2.out'
    }, 6.5);
  }

  // ── Init ───────────────────────────────────────────────────
  document.body.classList.add('intro-active');
  window.introComplete = false;

  // Wait for fonts + page to be ready
  if (document.readyState === 'complete') {
    runIntro();
  } else {
    window.addEventListener('load', runIntro);
  }

}());

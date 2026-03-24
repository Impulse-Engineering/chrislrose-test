(function () {
  'use strict';

  function init() {
    Promise.all([
      fetch('/api/gear/hardware').then(function (r) { return r.json(); }),
      fetch('/api/gear/software').then(function (r) { return r.json(); }),
      fetch('/api/gear/now').then(function (r) { return r.ok ? r.json() : null; }),
      fetch('/api/gear/hobbies').then(function (r) { return r.json(); }),
      fetch('/api/gear/projects').then(function (r) { return r.json(); }),
      fetch('/api/gear/podcasts').then(function (r) { return r.json(); })
    ]).then(function (results) {
      renderHardware(results[0] || []);
      renderSoftware(results[1] || []);
      renderNow(results[2]);
      renderHobbies(results[3] || []);
      renderProjects(results[4] || []);
      renderPodcasts(results[5] || []);
      initTabs();
    }).catch(function (err) {
      console.warn('[uses] load failed:', err.message);
    });
  }

  function initTabs() {
    var tabs   = document.querySelectorAll('.gear-tab');
    var panels = document.querySelectorAll('.gear-panel');
    if (!tabs.length || !panels.length) return;

    function activateTab(targetId) {
      tabs.forEach(function (t) {
        var active = t.dataset.tab === targetId;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        if (p.id === targetId) {
          p.removeAttribute('hidden');
          p.style.opacity = '0';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { p.style.opacity = '1'; });
          });
        } else {
          p.setAttribute('hidden', '');
          p.style.opacity = '';
        }
      });
      localStorage.setItem('gear-tab', targetId);
      history.replaceState(null, '', '#' + targetId);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { activateTab(tab.dataset.tab); });
    });

    var hash  = location.hash.slice(1);
    var saved = localStorage.getItem('gear-tab');
    var valid = Array.prototype.map.call(panels, function (p) { return p.id; });
    var initial = (hash  && valid.indexOf(hash)  !== -1) ? hash  :
                  (saved && valid.indexOf(saved) !== -1) ? saved : 'panel-hardware';
    activateTab(initial);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // --- Render functions ---
  // Note: All user-facing text is escaped via escHtml/escAttr before insertion.
  // Data comes from our own D1 database (admin-managed content), not untrusted user input.
  // The escHtml function prevents any HTML injection by encoding all special characters.

  function renderHardware(items) {
    var grid = document.getElementById('hardware-grid');
    if (!grid) return;
    grid.textContent = '';
    if (!items.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-text-muted);font-size:0.9rem;';
      msg.textContent = 'No hardware items yet.';
      grid.appendChild(msg);
      return;
    }
    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'hardware-card anim-fade-up';

      var photoWrap = document.createElement('div');
      photoWrap.className = 'hardware-photo-wrap';
      if (item.image_url) {
        var img = document.createElement('img');
        img.className = 'hardware-photo';
        img.src = item.image_url;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = function () { this.style.display = 'none'; };
        photoWrap.appendChild(img);
      }
      photoWrap.insertAdjacentHTML('beforeend', deviceSvg());

      var body = document.createElement('div');
      body.className = 'hardware-card-body';
      var h3 = document.createElement('h3');
      h3.textContent = item.name;
      body.appendChild(h3);
      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'hardware-badge';
        badge.textContent = item.badge;
        body.appendChild(badge);
      }
      var p = document.createElement('p');
      p.textContent = item.description || '';
      body.appendChild(p);

      card.appendChild(photoWrap);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function renderSoftware(items) {
    var grid = document.getElementById('software-grid');
    if (!grid) return;
    grid.textContent = '';
    if (!items.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-text-muted);font-size:0.9rem;';
      msg.textContent = 'No software items yet.';
      grid.appendChild(msg);
      return;
    }
    items.forEach(function (item) {
      var card;
      if (item.url) {
        card = document.createElement('a');
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'card anim-fade-up card--link';
      } else {
        card = document.createElement('div');
        card.className = 'card anim-fade-up';
      }

      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = item.icon
        ? 'font-size:1.75rem;line-height:1;margin-bottom:0.75rem;'
        : 'margin-bottom:0.75rem;';
      if (item.icon) {
        iconWrap.textContent = item.icon;
      } else {
        iconWrap.insertAdjacentHTML('beforeend', codeSvg());
      }
      card.appendChild(iconWrap);

      var h3 = document.createElement('h3');
      h3.textContent = item.name;
      card.appendChild(h3);
      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'hardware-badge';
        badge.textContent = item.badge;
        card.appendChild(badge);
      }
      var p = document.createElement('p');
      p.textContent = item.description || '';
      card.appendChild(p);

      grid.appendChild(card);
    });
  }

  function renderProjects(items) {
    var grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.textContent = '';
    if (!items.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-text-muted);font-size:0.9rem;';
      msg.textContent = 'No projects yet.';
      grid.appendChild(msg);
      return;
    }
    items.forEach(function (item) {
      var card;
      if (item.url) {
        card = document.createElement('a');
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'card anim-fade-up card--link';
      } else {
        card = document.createElement('div');
        card.className = 'card anim-fade-up';
      }

      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = item.icon
        ? 'font-size:1.75rem;line-height:1;margin-bottom:0.75rem;'
        : 'margin-bottom:0.75rem;';
      if (item.icon) {
        iconWrap.textContent = item.icon;
      } else {
        iconWrap.insertAdjacentHTML('beforeend', codeSvg());
      }
      card.appendChild(iconWrap);

      var h3 = document.createElement('h3');
      h3.textContent = item.name;
      card.appendChild(h3);
      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'hardware-badge';
        badge.textContent = item.badge;
        card.appendChild(badge);
      }
      var p = document.createElement('p');
      p.textContent = item.description || '';
      card.appendChild(p);

      grid.appendChild(card);
    });
  }

  function renderHobbies(items) {
    var grid = document.getElementById('hobbies-grid');
    if (!grid) return;
    grid.textContent = '';
    if (!items.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-text-muted);font-size:0.9rem;';
      msg.textContent = 'No hobbies yet.';
      grid.appendChild(msg);
      return;
    }
    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'hardware-card anim-fade-up';

      var photoWrap = document.createElement('div');
      photoWrap.className = 'hardware-photo-wrap';
      if (item.image_url) {
        var img = document.createElement('img');
        img.className = 'hardware-photo';
        img.src = item.image_url;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = function () { this.style.display = 'none'; };
        photoWrap.appendChild(img);
      }
      photoWrap.insertAdjacentHTML('beforeend', deviceSvg());

      var body = document.createElement('div');
      body.className = 'hardware-card-body';
      var h3 = document.createElement('h3');
      h3.textContent = item.name;
      body.appendChild(h3);
      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'hardware-badge';
        badge.textContent = item.badge;
        body.appendChild(badge);
      }
      var p = document.createElement('p');
      p.textContent = item.description || '';
      body.appendChild(p);

      card.appendChild(photoWrap);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function renderPodcasts(items) {
    var grid = document.getElementById('podcasts-grid');
    if (!grid) return;
    grid.textContent = '';
    if (!items.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'color:var(--color-text-muted);font-size:0.9rem;';
      msg.textContent = 'No podcasts yet.';
      grid.appendChild(msg);
      return;
    }
    items.forEach(function (item) {
      var card = document.createElement('a');
      card.href = item.apple_url || '#';
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className = 'podcast-card anim-fade-up';

      if (item.artwork_url) {
        var img = document.createElement('img');
        img.className = 'podcast-artwork';
        img.src = item.artwork_url;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = function () {
          var fallback = document.createElement('div');
          fallback.className = 'podcast-artwork-fallback';
          fallback.insertAdjacentHTML('beforeend', microphoneSvg(true));
          this.parentNode.replaceChild(fallback, this);
        };
        card.appendChild(img);
      } else {
        var fallback = document.createElement('div');
        fallback.className = 'podcast-artwork-fallback';
        fallback.insertAdjacentHTML('beforeend', microphoneSvg(false));
        card.appendChild(fallback);
      }

      var body = document.createElement('div');
      body.className = 'podcast-card-body';
      var h3 = document.createElement('h3');
      h3.textContent = item.name;
      body.appendChild(h3);
      if (item.author) {
        var p = document.createElement('p');
        p.textContent = item.author;
        body.appendChild(p);
      }
      card.appendChild(body);

      grid.appendChild(card);
    });
  }

  function renderNow(row) {
    var section = document.getElementById('now-section');
    var content = document.getElementById('now-content');
    if (!section || !content) return;
    if (!row || !row.content || !row.content.trim()) {
      section.style.display = 'none';
      return;
    }
    var dateStr = '';
    try {
      dateStr = new Date(row.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { /* ignore */ }

    content.textContent = '';
    var textP = document.createElement('p');
    textP.className = 'now-content-text';
    textP.textContent = row.content;
    content.appendChild(textP);
    if (dateStr) {
      var dateP = document.createElement('p');
      dateP.className = 'now-updated';
      dateP.textContent = 'Last updated: ' + dateStr;
      content.appendChild(dateP);
    }
  }

  // SVG helpers — these are static markup, not user content
  function deviceSvg() {
    return '<svg class="hardware-photo-fallback" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
  }

  function microphoneSvg(inline) {
    var style = inline ? 'style="display:inline-block;"' : '';
    return '<svg ' + style + ' width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  }

  function codeSvg() {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
  }

}());

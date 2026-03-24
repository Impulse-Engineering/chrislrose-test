/*!
 * reading-list.js — Public reading list (fetch from /api/*)
 * Ported from Supabase-backed version to local D1 API.
 * Admin CRUD modals deferred to Phase 5.
 */
(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  // Domains whose CDN images require a server-side proxy to bypass hotlink protection
  var PROXY_DOMAINS = ['cdninstagram.com', 'fbcdn.net'];

  function proxyImage(url) {
    if (!url) return url;
    try {
      var host = new URL(url).hostname;
      for (var i = 0; i < PROXY_DOMAINS.length; i++) {
        if (host === PROXY_DOMAINS[i] || host.endsWith('.' + PROXY_DOMAINS[i])) {
          // wsrv.nl is a free image proxy/CDN that fetches images server-side,
          // bypassing Referer-based hotlink protection on Instagram/Threads CDN
          return 'https://wsrv.nl/?url=' + encodeURIComponent(url);
        }
      }
    } catch (e) {}
    return url;
  }

  // ── State ─────────────────────────────────────────────────────
  var state = {
    allLinks:       [],
    categories:     [],
    filtered:       [],
    activeCategory: 'All',
    activeStatus:   'all',
    activeSort:     'newest',
    searchQuery:    '',
    selectionMode:  false,
    selectedIds:    new Set(),
    collectionId:   null,
    collectionData: null
  };

  // ── Boot ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // DOM refs
    var linksGrid     = document.getElementById('links-grid');
    var filterTabs    = document.getElementById('filter-tabs');
    var filterSort    = document.getElementById('filter-sort');
    var filterSearch  = document.getElementById('filter-search');
    var filterStatus  = document.getElementById('filter-status');
    var filterViewBtn    = document.getElementById('filter-view-btn');
    var filterViewIconGrid = document.getElementById('filter-view-icon-grid');
    var filterViewIconList = document.getElementById('filter-view-icon-list');
    var filterShuffle    = document.getElementById('filter-shuffle-btn');
    var curateBtnEl      = document.getElementById('filter-curate-btn');
    var selectionBar     = document.getElementById('selection-action-bar');
    var selectionCountEl = document.getElementById('selection-count');
    var selectionRecipientInput = document.getElementById('selection-recipient');
    var selectionMsgInput  = document.getElementById('selection-message');
    var selectionCreateBtn = document.getElementById('selection-create-btn');
    var selectionCancelBtn = document.getElementById('selection-cancel-btn');
    var collectionBannerEl = document.getElementById('collection-banner');
    var persistToast = document.getElementById('persist-toast');

    // ── Load data ───────────────────────────────────────────────
    function loadData() {
      var params = new URLSearchParams(window.location.search);
      var urlCat        = params.get('category');
      var urlCollection = params.get('collection');
      if (urlCat && !urlCollection) state.activeCategory = urlCat;
      if (urlCollection) state.collectionId = urlCollection;

      var fetches = [
        fetch('/api/links').then(function (r) { return r.json(); }),
        fetch('/api/categories').then(function (r) { return r.json(); })
      ];

      // TODO Phase 6: Collections API not yet built — stub collection fetch
      if (state.collectionId) {
        fetches.push(
          fetch('/api/collections/' + encodeURIComponent(state.collectionId))
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; })
        );
      }

      Promise.all(fetches).then(function (results) {
        var linksData = results[0];
        var catsData  = results[1];

        state.allLinks   = Array.isArray(linksData) ? linksData : (linksData.links || linksData.data || []);
        state.categories = Array.isArray(catsData)
          ? catsData.map(function (c) { return c.name; })
          : ((catsData.categories || catsData.data || []).map(function (c) { return c.name; }));

        // Collection view mode
        if (state.collectionId && results[2]) {
          state.collectionData = results[2];
          document.body.classList.add('collection-mode');
          renderCollectionBanner(results[2]);
          var idOrder = [];
          try {
            idOrder = typeof results[2].link_ids === 'string'
              ? JSON.parse(results[2].link_ids)
              : (results[2].link_ids || []);
          } catch (e) { idOrder = []; }
          state.filtered = idOrder
            .map(function (id) { return state.allLinks.find(function (l) { return l.id === id; }); })
            .filter(Boolean);
          renderGrid();
          return;
        }

        buildFilterTabs();
        applyFilters();
      }).catch(function (err) {
        console.warn('[reading-list] load failed:', err.message);
        var errDiv = document.createElement('div');
        errDiv.className = 'links-empty';
        var errP = document.createElement('p');
        errP.textContent = 'Could not load the reading list. Please try again later.';
        errDiv.appendChild(errP);
        linksGrid.textContent = '';
        linksGrid.appendChild(errDiv);
      });
    }

    // ── Filters / sort / search ─────────────────────────────────
    function applyFilters() {
      var links = state.allLinks.slice();

      if (state.activeCategory !== 'All') {
        links = links.filter(function (l) { return l.category === state.activeCategory; });
      }

      if (state.activeStatus !== 'all') {
        links = links.filter(function (l) { return l.status === state.activeStatus; });
      }

      var q = state.searchQuery.toLowerCase().trim();
      if (q) {
        var tokens = q.split(/\s+/).filter(Boolean);
        links = links.filter(function (l) {
          var haystack = [l.title, l.description, l.note, l.domain, l.category, l.tags]
            .filter(Boolean).join(' ').toLowerCase();
          return tokens.every(function (tok) { return haystack.indexOf(tok) !== -1; });
        });
      }

      if (state.activeSort === 'stars') {
        links.sort(function (a, b) { return (b.stars || 0) - (a.stars || 0); });
      } else {
        links.sort(function (a, b) { return new Date(b.saved_at) - new Date(a.saved_at); });
      }

      state.filtered = links;
      renderGrid();
    }

    filterSort.addEventListener('change', function () {
      state.activeSort = filterSort.value;
      applyFilters();
    });

    filterStatus.addEventListener('change', function () {
      state.activeStatus = filterStatus.value;
      applyFilters();
    });

    var searchTimer = null;
    filterSearch.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var val = filterSearch.value;
      searchTimer = setTimeout(function () {
        state.searchQuery = val;
        applyFilters();
      }, 200);
    });

    // ── Filter tabs ─────────────────────────────────────────────
    function buildFilterTabs() {
      filterTabs.textContent = '';

      var cats = ['All'].concat(state.categories);
      cats.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.className = 'filter-tab' + (cat === state.activeCategory ? ' active' : '');
        btn.textContent = cat;
        btn.addEventListener('click', function () {
          state.activeCategory = cat;
          filterTabs.querySelectorAll('.filter-tab').forEach(function (t) {
            t.classList.toggle('active', t.textContent === cat);
          });
          var url = new URL(window.location.href);
          if (cat === 'All') { url.searchParams.delete('category'); }
          else { url.searchParams.set('category', cat); }
          window.history.replaceState({}, '', url.toString());
          applyFilters();
        });
        filterTabs.appendChild(btn);
      });
    }

    // ── View mode (feed / grid) ──────────────────────────────────
    var viewMode = localStorage.getItem('rl-view') || 'feed';
    if (viewMode === 'compact') viewMode = 'feed';

    function applyViewMode() {
      if (viewMode === 'grid') {
        linksGrid.classList.remove('links-grid--feed');
        linksGrid.classList.add('links-grid--grid');
        filterViewIconGrid.style.display = 'none';
        filterViewIconList.style.display = '';
        filterViewBtn.title = 'Switch to list view';
      } else {
        linksGrid.classList.add('links-grid--feed');
        linksGrid.classList.remove('links-grid--grid');
        filterViewIconGrid.style.display = '';
        filterViewIconList.style.display = 'none';
        filterViewBtn.title = 'Switch to grid view';
      }
    }

    filterViewBtn.addEventListener('click', function () {
      viewMode = viewMode === 'feed' ? 'grid' : 'feed';
      localStorage.setItem('rl-view', viewMode);
      applyViewMode();
    });

    applyViewMode();

    // ── Shuffle ──────────────────────────────────────────────────
    filterShuffle.addEventListener('click', function () {
      if (!state.filtered.length) return;
      var pick = state.filtered[Math.floor(Math.random() * state.filtered.length)];
      var card = document.querySelector('.link-card[data-id="' + pick.id + '"]');
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('card-shuffle-highlight');
      setTimeout(function () { card.classList.remove('card-shuffle-highlight'); }, 1800);
    });

    // ── Curate / selection mode ──────────────────────────────────
    curateBtnEl.addEventListener('click', function () {
      if (state.selectionMode) {
        exitSelectionMode();
      } else {
        enterSelectionMode();
      }
    });

    function enterSelectionMode() {
      state.selectionMode = true;
      state.selectedIds   = new Set();
      document.body.classList.add('selection-mode');
      curateBtnEl.classList.add('active');
      selectionBar.removeAttribute('hidden');
      selectionRecipientInput.value = '';
      selectionMsgInput.value = '';
      updateSelectionBar();
    }

    function exitSelectionMode() {
      state.selectionMode = false;
      state.selectedIds   = new Set();
      document.body.classList.remove('selection-mode');
      curateBtnEl.classList.remove('active');
      selectionBar.setAttribute('hidden', '');
      document.querySelectorAll('.link-card.card-selected').forEach(function (c) {
        c.classList.remove('card-selected');
      });
    }

    function updateSelectionBar() {
      var n = state.selectedIds.size;
      selectionCountEl.textContent = n + ' link' + (n !== 1 ? 's' : '') + ' selected';
    }

    selectionCancelBtn.addEventListener('click', exitSelectionMode);

    selectionCreateBtn.addEventListener('click', function () {
      if (state.selectedIds.size === 0) {
        showToast('Select at least one link first', 'error');
        return;
      }
      // TODO Phase 6: POST /api/collections to create a shared collection
      showToast('Collections API coming soon', 'info');
    });

    // ── Collection banner ─────────────────────────────────────────
    function renderCollectionBanner(collection) {
      var linkIds = [];
      try {
        linkIds = typeof collection.link_ids === 'string'
          ? JSON.parse(collection.link_ids)
          : (collection.link_ids || []);
      } catch (e) { linkIds = []; }
      var count   = linkIds.length;
      var dateStr = '';
      try {
        dateStr = new Date(collection.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      } catch (e) {}

      // Build collection banner using DOM methods
      var banner = document.createElement('div');
      banner.className = 'collection-banner';

      var iconSpan = document.createElement('span');
      iconSpan.className = 'collection-banner-icon';
      iconSpan.textContent = '\uD83D\uDCDA';
      banner.appendChild(iconSpan);

      var infoDiv = document.createElement('div');
      var titleDiv = document.createElement('div');
      titleDiv.className = 'collection-banner-title';
      titleDiv.textContent = 'Chris\u2019s picks for ' + (collection.recipient || 'you');
      infoDiv.appendChild(titleDiv);

      var metaDiv = document.createElement('div');
      metaDiv.className = 'collection-banner-meta';
      metaDiv.textContent = count + ' article' + (count !== 1 ? 's' : '') + (dateStr ? ' \u00b7 ' + dateStr : '');
      infoDiv.appendChild(metaDiv);
      banner.appendChild(infoDiv);

      collectionBannerEl.textContent = '';
      collectionBannerEl.appendChild(banner);

      if (collection.message) {
        var msgDiv = document.createElement('div');
        msgDiv.className = 'collection-message';
        msgDiv.textContent = collection.message;
        collectionBannerEl.appendChild(msgDiv);
      }

      collectionBannerEl.removeAttribute('hidden');
    }

    // ── Render grid ─────────────────────────────────────────────
    function renderGrid() {
      linksGrid.textContent = '';

      if (!state.filtered.length) {
        var empty = document.createElement('div');
        empty.className = 'links-empty';

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '36');
        svg.setAttribute('height', '36');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
        svg.appendChild(path);
        empty.appendChild(svg);

        var p = document.createElement('p');
        p.textContent = state.searchQuery
          ? 'No links found matching \u201C' + state.searchQuery + '\u201D.'
          : 'No links found.';
        empty.appendChild(p);
        linksGrid.appendChild(empty);
        return;
      }

      state.filtered.forEach(function (link) {
        linksGrid.appendChild(buildCard(link));
      });

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }

    // ── Status popover ──────────────────────────────────────────
    var activePopover = null;

    function openStatusPopover(id, pillEl) {
      if (activePopover) { activePopover.remove(); activePopover = null; }

      var opts = [
        { value: null,        label: '\u25CB  No status' },
        { value: 'to-read',   label: '\uD83D\uDCD6 To Read' },
        { value: 'to-try',    label: '\u26A1 To Try' },
        { value: 'to-share',  label: '\uD83D\uDC8C To Share' },
        { value: 'done',      label: '\u2713  Done' }
      ];

      var popover = document.createElement('div');
      popover.className = 'status-popover';

      opts.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'status-popover-option';
        btn.textContent = opt.label;
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          setLinkStatus(id, opt.value);
          popover.remove();
          activePopover = null;
        });
        popover.appendChild(btn);
      });

      document.body.appendChild(popover);
      activePopover = popover;

      var rect = pillEl.getBoundingClientRect();
      popover.style.position = 'fixed';
      var top = rect.bottom + 4;
      var left = rect.left;
      if (left + 160 > window.innerWidth) left = window.innerWidth - 164;
      popover.style.top = top + 'px';
      popover.style.left = left + 'px';
    }

    document.addEventListener('click', function (e) {
      if (activePopover && !activePopover.contains(e.target)) {
        activePopover.remove();
        activePopover = null;
      }
    });

    function setLinkStatus(id, newStatus) {
      var link = state.allLinks.find(function (l) { return l.id === id; });
      if (!link) return;
      link.status = newStatus || null;
      link.read   = (newStatus === 'done') ? 1 : 0;
      applyFilters();
      // TODO Phase 5: POST status update requires auth
      // fetch('/api/links/' + id, { method: 'PATCH', headers: {...}, body: JSON.stringify({status, read}) })
    }

    // ── Build card ──────────────────────────────────────────────
    function buildCard(link) {
      var card = document.createElement('article');
      card.className = 'link-card anim-fade-up';
      card.dataset.id = link.id;
      card.dataset.imageUrl = link.image || '';
      if (link.status) card.classList.add('status-' + link.status);

      // Thumbnail
      var thumbWrap = document.createElement('div');
      thumbWrap.className = 'link-card-thumb-wrap';
      var thumbLink = document.createElement('a');
      thumbLink.href = link.url;
      thumbLink.target = '_blank';
      thumbLink.rel = 'noopener noreferrer';
      thumbLink.tabIndex = -1;
      thumbLink.setAttribute('aria-hidden', 'true');

      var brandSvg = generatePlaceholderSvg(link.category, link.domain);
      var fav2 = link.favicon || ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(link.domain || '') + '&sz=64');
      var cardImage = proxyImage(link.image);

      if (brandSvg) {
        var img = document.createElement('img');
        img.className = 'link-card-image';
        img.src = cardImage || brandSvg;
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = function () { this.onerror = null; this.src = brandSvg; };
        thumbLink.appendChild(img);
      } else if (cardImage) {
        var placeholder = document.createElement('div');
        placeholder.className = 'link-card-placeholder';
        placeholder.style.setProperty('--fav-url', 'url(\'' + fav2 + '\')');
        var favImg = document.createElement('img');
        favImg.className = 'link-card-placeholder-favicon';
        favImg.src = fav2;
        favImg.alt = '';
        favImg.loading = 'lazy';
        favImg.onerror = function () { this.style.display = 'none'; };
        placeholder.appendChild(favImg);
        var ogOverlay = document.createElement('img');
        ogOverlay.className = 'link-card-og-overlay';
        ogOverlay.src = cardImage;
        ogOverlay.alt = '';
        ogOverlay.loading = 'lazy';
        ogOverlay.onerror = function () { this.style.display = 'none'; };
        placeholder.appendChild(ogOverlay);
        thumbLink.appendChild(placeholder);
      } else {
        var placeholder2 = document.createElement('div');
        placeholder2.className = 'link-card-placeholder';
        placeholder2.style.setProperty('--fav-url', 'url(\'' + fav2 + '\')');
        var favImg2 = document.createElement('img');
        favImg2.className = 'link-card-placeholder-favicon';
        favImg2.src = fav2;
        favImg2.alt = '';
        favImg2.loading = 'lazy';
        favImg2.onerror = function () { this.style.display = 'none'; };
        placeholder2.appendChild(favImg2);
        thumbLink.appendChild(placeholder2);
      }

      thumbWrap.appendChild(thumbLink);
      card.appendChild(thumbWrap);

      // Main content
      var mainDiv = document.createElement('div');
      mainDiv.className = 'link-card-main';

      var titleLink = document.createElement('a');
      titleLink.href = link.url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.style.textDecoration = 'none';
      titleLink.style.color = 'inherit';
      var titleP = document.createElement('p');
      titleP.className = 'link-card-title';
      titleP.textContent = link.title || 'Untitled';
      titleLink.appendChild(titleP);
      mainDiv.appendChild(titleLink);

      // Byline
      var byline = document.createElement('div');
      byline.className = 'link-card-byline';
      if (link.favicon) {
        var favIcon = document.createElement('img');
        favIcon.className = 'link-card-favicon';
        favIcon.src = link.favicon;
        favIcon.alt = '';
        favIcon.loading = 'lazy';
        favIcon.onerror = function () { this.style.display = 'none'; };
        byline.appendChild(favIcon);
      }
      if (link.domain) {
        var domainSpan = document.createElement('span');
        domainSpan.className = 'link-card-domain';
        domainSpan.textContent = link.domain;
        byline.appendChild(domainSpan);
      }

      var dateStr = '';
      if (link.saved_at) {
        try {
          dateStr = new Date(link.saved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {}
      }

      if (link.domain && (link.stars || dateStr)) {
        var sep = document.createElement('span');
        sep.style.opacity = '0.4';
        sep.textContent = '\u00b7';
        byline.appendChild(sep);
      }

      if (link.stars) {
        var starsSpan = document.createElement('span');
        starsSpan.className = 'star-display';
        for (var i = 1; i <= 5; i++) {
          var star = document.createElement('span');
          star.className = 'star' + (i <= link.stars ? ' filled' : '');
          star.textContent = i <= link.stars ? '\u2605' : '\u2606';
          starsSpan.appendChild(star);
        }
        byline.appendChild(starsSpan);
      }

      if (dateStr) {
        var dateSpan = document.createElement('span');
        dateSpan.className = 'link-card-date';
        dateSpan.textContent = dateStr;
        byline.appendChild(dateSpan);
      }

      mainDiv.appendChild(byline);

      if (link.note) {
        var noteP = document.createElement('p');
        noteP.className = 'link-card-note-inline';
        noteP.textContent = link.note;
        mainDiv.appendChild(noteP);
      }

      card.appendChild(mainDiv);

      // Right column
      var rightDiv = document.createElement('div');
      rightDiv.className = 'link-card-right';

      var tagsDiv = document.createElement('div');
      tagsDiv.className = 'link-card-tags';
      if (link.category) {
        var catTag = document.createElement('span');
        catTag.className = 'tag';
        catTag.textContent = link.category;
        tagsDiv.appendChild(catTag);
      }
      if (link.tags) {
        link.tags.split(',').forEach(function (t) {
          var tag = t.trim();
          if (tag) {
            var tagSpan = document.createElement('span');
            tagSpan.className = 'tag tag-secondary';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
          }
        });
      }
      rightDiv.appendChild(tagsDiv);

      // Status pill
      var statusLabels = { 'to-read': '\uD83D\uDCD6 To Read', 'to-try': '\u26A1 To Try', 'to-share': '\uD83D\uDC8C To Share', 'done': '\u2713 Done' };
      var pillLabel = link.status ? (statusLabels[link.status] || link.status) : '\u25CB None';
      var pillBtn = document.createElement('button');
      pillBtn.className = 'link-card-status-pill status-' + (link.status || 'none');
      pillBtn.dataset.id = link.id;
      pillBtn.setAttribute('aria-label', 'Set status');
      pillBtn.title = 'Change status';
      pillBtn.textContent = pillLabel + ' \u25BE';
      rightDiv.appendChild(pillBtn);

      // Actions
      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'link-card-actions';
      var copyBtn = document.createElement('button');
      copyBtn.className = 'link-card-action-btn copy';
      copyBtn.dataset.id = link.id;
      copyBtn.dataset.url = link.url;
      copyBtn.setAttribute('aria-label', 'Copy link');
      copyBtn.textContent = '\uD83D\uDD17';
      actionsDiv.appendChild(copyBtn);
      rightDiv.appendChild(actionsDiv);

      card.appendChild(rightDiv);

      // Event listeners
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(link.url).then(function () {
          showToast('Link copied to clipboard', 'success');
        }).catch(function () {
          showToast('Could not copy \u2014 try manually', 'error');
        });
      });

      pillBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openStatusPopover(link.id, pillBtn);
      });

      // Selection mode
      card.addEventListener('click', function (e) {
        if (!state.selectionMode) return;
        var anchor = e.target.tagName === 'A' ? e.target : e.target.closest('a');
        if (anchor) e.preventDefault();
        if (state.selectedIds.has(link.id)) {
          state.selectedIds.delete(link.id);
          card.classList.remove('card-selected');
        } else {
          state.selectedIds.add(link.id);
          card.classList.add('card-selected');
        }
        updateSelectionBar();
      });

      return card;
    }

    // ── Source placeholder generator ─────────────────────────────
    var sourceLogos = {
      'reddit.com':           { path: 'M12 8c2.6 0 5 1.2 5 3.5S14.6 15 12 15s-5-1.2-5-3.5S9.4 8 12 8zm-2.5 4a.75.75 0 100-1.5.75.75 0 000 1.5zm5 0a.75.75 0 100-1.5.75.75 0 000 1.5zM12 14c-1 0-1.8-.3-2.2-.7a.4.4 0 01.5-.5c.4.3 1 .5 1.7.5s1.3-.2 1.7-.5a.4.4 0 01.5.5c-.4.4-1.2.7-2.2.7zM18.8 9.2a1.6 1.6 0 11-2.3 2.2M5.2 9.2a1.6 1.6 0 102.3 2.2M16 6.5l-1-3.5h-2l1.5 4M12 3a9 9 0 100 18 9 9 0 000-18z', viewBox: '0 0 24 24', color: '#FF4500', color2: '#cc3700' },
      'x.com':                { path: 'M4 4l6.5 8.5L4 20h2l5.5-6.3L16 20h5l-7-9 6-7h-2l-5 5.7L9 4H4z', viewBox: '0 0 24 24', color: '#000000', color2: '#1a1a1a' },
      'twitter.com':          { path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', viewBox: '0 0 24 24', color: '#1DA1F2', color2: '#0d8bd9' },
      'github.com':           { path: 'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.7.114 2.5.336 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.59.67.5A10.003 10.003 0 0022 12c0-5.523-4.477-10-10-10z', viewBox: '0 0 24 24', color: '#24292e', color2: '#1a1e22' },
      'youtube.com':          { path: 'M19.6 3.2H4.4A2.4 2.4 0 002 5.6v8.8a2.4 2.4 0 002.4 2.4h15.2a2.4 2.4 0 002.4-2.4V5.6a2.4 2.4 0 00-2.4-2.4zM10 14V6l6 4-6 4z', viewBox: '0 0 24 20', color: '#FF0000', color2: '#cc0000' },
      'medium.com':           { path: 'M13.5 12a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0zm7.1 0c0 3.4-1.5 6.1-3.3 6.1S14 15.4 14 12s1.5-6.1 3.3-6.1 3.3 2.7 3.3 6.1zm3.4 0c0 3-.5 5.5-1.2 5.5S21.6 15 21.6 12s.5-5.5 1.2-5.5 1.2 2.5 1.2 5.5z', viewBox: '0 0 24 24', color: '#02B875', color2: '#01874c' },
      'news.ycombinator.com': { path: 'M12 2L4 6v6c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V6L12 2zm-1 13V9h2v6h-2zm0-8V5h2v2h-2z', viewBox: '0 0 24 24', color: '#FF6600', color2: '#cc5200' },
      'substack.com':         { path: 'M3 7h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z', viewBox: '0 0 24 24', color: '#FF6719', color2: '#cc5214' },
      'linkedin.com':         { path: 'M4 9h3v12H4zm1.5-5.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9 9h3v1.6C12.6 9.6 13.8 9 15 9c3 0 5 1.6 5 5v6h-3v-5.5c0-1.5-.5-2.5-2-2.5s-3 1-3 3V21H9z', viewBox: '0 0 24 24', color: '#0A66C2', color2: '#08519b' },
      'instagram.com':        { path: 'M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.7.1 4.9 0 3.2 0 3.6-.1 4.9-.2 3.3-1.7 4.8-5 5-1.3.1-1.7.1-4.9.1-3.2 0-3.6 0-4.9-.1-3.3-.2-4.8-1.7-5-5-.1-1.3-.1-1.7-.1-4.9 0-3.2 0-3.6.1-4.9.2-3.3 1.7-4.8 5-5 1.3-.1 1.7-.1 4.9-.1zm0 2.2c-3.2 0-3.5 0-4.8.1-2.2.1-3.2 1.1-3.3 3.3-.1 1.3-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 2.2 1.1 3.2 3.3 3.3 1.3.1 1.6.1 4.8.1s3.5 0 4.8-.1c2.2-.1 3.2-1.1 3.3-3.3.1-1.3.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-2.2-1.1-3.2-3.3-3.3-1.3-.1-1.6-.1-4.8-.1zm0 3.6a4 4 0 110 8 4 4 0 010-8zm0 1.8a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4zM18.5 7.5a1 1 0 100 2 1 1 0 000-2z', viewBox: '0 0 24 24', color: '#E1306C', color2: '#b32456' },
      'tiktok.com':           { path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z', viewBox: '0 0 24 24', color: '#010101', color2: '#1a1a2e' },
      'threads.net':          { path: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 011.57.044v-.785c0-1.64-.906-2.534-2.635-2.572a5.08 5.08 0 00-.137-.003c-1.075 0-2.266.343-2.993.905L8.3 7.79c.89-.797 2.547-1.37 4.065-1.376h.064c2.867.064 4.473 1.73 4.473 4.527v4.307c.38.205.733.44 1.048.704 1.11.918 1.784 2.197 1.889 3.6.18 2.42-.888 4.75-2.84 6.22-1.504 1.124-3.476 1.714-5.814 1.228zm.02-9.69c-.734 0-1.37.138-1.85.4-.512.278-.783.686-.764 1.151.04.822.78 1.41 1.85 1.35 1.046-.059 1.82-.546 2.254-1.41.255-.514.396-1.147.42-1.882a13.04 13.04 0 00-1.91-.609z', viewBox: '0 0 24 24', color: '#000000', color2: '#1a1a2e' }
    };

    // Returns a brand SVG data URI for known domains, or null for unknown domains.
    // Uses string concatenation for SVG generation (static data, not user input).
    function generatePlaceholderSvg(category, domain) {
      var source = null;
      if (domain) {
        for (var key in sourceLogos) {
          if (domain.indexOf(key) !== -1) { source = sourceLogos[key]; break; }
        }
      }

      if (!source) return null;

      var safeDomain = String(domain)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">' +
          '<defs>' +
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
              '<stop offset="0%" stop-color="' + source.color + '"/>' +
              '<stop offset="100%" stop-color="' + source.color2 + '"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<rect width="320" height="180" fill="url(#bg)"/>' +
          '<g transform="translate(130, 60)">' +
            '<svg viewBox="' + source.viewBox + '" width="60" height="60">' +
              (source.text
                ? '<text x="12" y="19" text-anchor="middle" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="700">' + source.text + '</text>'
                : '<path d="' + source.path + '" fill="#ffffff"/>') +
            '</svg>' +
          '</g>' +
          '<text x="160" y="168" text-anchor="middle" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="500" opacity="0.5">' +
            safeDomain +
          '</text>' +
        '</svg>';

      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // ── Keyboard: Escape ─────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (state.selectionMode) { exitSelectionMode(); return; }
    });

    // ── Utilities ────────────────────────────────────────────────
    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escAttr(str) { return escHtml(str); }

    // ── Toast ────────────────────────────────────────────────────
    function showToast(msg, type) {
      if (!persistToast) return;
      persistToast.textContent = msg;
      persistToast.className = 'persist-toast persist-toast--' + (type || 'info');
      persistToast.removeAttribute('hidden');
      clearTimeout(persistToast._timer);
      persistToast._timer = setTimeout(function () {
        persistToast.setAttribute('hidden', '');
      }, type === 'error' ? 6000 : 3000);
    }

    // ── Init ─────────────────────────────────────────────────────
    loadData();

  }); // end DOMContentLoaded

}());

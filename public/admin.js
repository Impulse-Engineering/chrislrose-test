/*!
 * admin.js — Admin dashboard (category management, gear CRUD, now editing)
 * Requires authentication; redirects to /login if session is absent.
 */
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────
  var state = {
    categories:        [],
    hardware:          [],
    software:          [],
    hobbies:           [],
    projects:          [],
    podcasts:          [],
    editingHardwareId: null,
    editingSoftwareId: null,
    editingHobbyId:    null,
    editingProjectId:  null,
    editingPodcastId:  null
  };

  // ── Helper: status message ─────────────────────────────────────
  function showStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = (type === 'error') ? '#dc2626' : '#16a34a';
    setTimeout(function () {
      el.textContent = '';
      el.style.color = '';
    }, 3000);
  }

  // ── Boot ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // ── Tab switching ────────────────────────────────────────────
    var tabBtns     = document.querySelectorAll('.admin-tab');
    var tabSections = document.querySelectorAll('.admin-section');

    function activateTab(targetId) {
      for (var ti = 0; ti < tabBtns.length; ti++) {
        tabBtns[ti].classList.remove('active');
      }
      for (var si = 0; si < tabSections.length; si++) {
        tabSections[si].classList.remove('active');
      }
      for (var bi = 0; bi < tabBtns.length; bi++) {
        if (tabBtns[bi].getAttribute('data-tab') === targetId) {
          tabBtns[bi].classList.add('active');
        }
      }
      var targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    }

    for (var ti = 0; ti < tabBtns.length; ti++) {
      tabBtns[ti].addEventListener('click', function () {
        activateTab(this.getAttribute('data-tab'));
      });
    }

    // ── Auth check ───────────────────────────────────────────────
    fetch('/api/auth/session').then(function (res) {
      if (!res.ok) {
        window.location.href = '/login?redirect=/admin';
        return null;
      }
      return res.json();
    }).then(function (data) {
      if (!data) return;
      loadAll();
    }).catch(function (err) {
      console.warn('[admin] session check failed:', err.message);
      window.location.href = '/login?redirect=/admin';
    });

    // ── Logout ───────────────────────────────────────────────────
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        fetch('/api/auth/logout', { method: 'POST' }).then(function () {
          window.location.href = '/login';
        }).catch(function () {
          window.location.href = '/login';
        });
      });
    }

    // ── loadAll ──────────────────────────────────────────────────
    function loadAll() {
      loadCategories();
      loadGear();
      loadNow();
    }

    // ════════════════════════════════════════════════════════════
    // CATEGORY MANAGEMENT
    // ════════════════════════════════════════════════════════════

    var catChips   = document.getElementById('cat-chips');
    var catInput   = document.getElementById('cat-input');
    var catAddBtn  = document.getElementById('cat-add-btn');
    var catStatus  = document.getElementById('cat-status');

    function renderChips() {
      catChips.textContent = '';
      for (var i = 0; i < state.categories.length; i++) {
        catChips.appendChild(buildChip(state.categories[i]));
      }
    }

    function buildChip(name) {
      var chip = document.createElement('span');
      chip.className = 'cat-chip';
      var label = document.createElement('span');
      label.textContent = name;
      var delBtn = document.createElement('button');
      delBtn.textContent = '\u00d7';
      delBtn.className = 'cat-chip-del';
      delBtn.addEventListener('click', function () {
        chip.parentNode.removeChild(chip);
        saveCategories();
      });
      chip.appendChild(label);
      chip.appendChild(delBtn);
      return chip;
    }

    function collectChipNames() {
      var chips = catChips.querySelectorAll('.cat-chip');
      var names = [];
      for (var i = 0; i < chips.length; i++) {
        var labelEl = chips[i].querySelector('span');
        if (labelEl && labelEl.textContent.trim()) {
          names.push(labelEl.textContent.trim());
        }
      }
      return names;
    }

    function saveCategories() {
      var names = collectChipNames();
      var payload = [];
      for (var i = 0; i < names.length; i++) {
        payload.push({ name: names[i], sort_order: i });
      }
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payload })
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Save failed'); });
        return res.json();
      }).then(function () {
        state.categories = names;
        showStatus(catStatus, 'Saved', 'success');
      }).catch(function (err) {
        showStatus(catStatus, err.message, 'error');
      });
    }

    function loadCategories() {
      fetch('/api/categories').then(function (res) {
        return res.json();
      }).then(function (data) {
        var raw = Array.isArray(data) ? data : (data.categories || data.data || []);
        state.categories = raw.map(function (c) { return typeof c === 'string' ? c : c.name; });
        renderChips();
      }).catch(function (err) {
        console.warn('[admin] loadCategories failed:', err.message);
      });
    }

    if (catAddBtn) {
      catAddBtn.addEventListener('click', function () {
        var name = catInput.value.trim();
        if (!name) return;
        catInput.value = '';
        catChips.appendChild(buildChip(name));
        saveCategories();
      });
    }

    if (catInput) {
      catInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (catAddBtn) catAddBtn.click();
        }
      });
    }

    // ════════════════════════════════════════════════════════════
    // GEAR MANAGEMENT — shared helpers
    // ════════════════════════════════════════════════════════════

    var GEAR_CONFIG = [
      {
        type:      'hardware',
        label:     'Hardware',
        apiPath:   'hardware',
        listId:    'hardware-list',
        addBtnId:  'add-hardware-btn',
        modalId:   'hw-modal',
        backdropId:'hw-modal-backdrop',
        closeId:   'hw-modal-close',
        titleId:   'hw-modal-title',
        saveBtnId: 'hw-save-btn',
        statusId:  'hw-status',
        prefix:    'hw',
        stateKey:  'editingHardwareId',
        fields: [
          { key: 'name',        label: 'Name',      id: 'hw-name',        type: 'text' },
          { key: 'badge',       label: 'Badge',     id: 'hw-badge',       type: 'text' },
          { key: 'image_url',   label: 'Image URL', id: 'hw-image_url',   type: 'text' },
          { key: 'description', label: 'Description', id: 'hw-description', type: 'textarea' }
        ]
      },
      {
        type:      'software',
        label:     'Software',
        apiPath:   'software',
        listId:    'software-list',
        addBtnId:  'add-software-btn',
        modalId:   'sw-modal',
        backdropId:'sw-modal-backdrop',
        closeId:   'sw-modal-close',
        titleId:   'sw-modal-title',
        saveBtnId: 'sw-save-btn',
        statusId:  'sw-status',
        prefix:    'sw',
        stateKey:  'editingSoftwareId',
        fields: [
          { key: 'name',        label: 'Name',        id: 'sw-name',        type: 'text' },
          { key: 'badge',       label: 'Badge',       id: 'sw-badge',       type: 'text' },
          { key: 'icon',        label: 'Icon',        id: 'sw-icon',        type: 'text' },
          { key: 'url',         label: 'URL',         id: 'sw-url',         type: 'text' },
          { key: 'description', label: 'Description', id: 'sw-description', type: 'textarea' }
        ]
      },
      {
        type:      'hobbies',
        label:     'Hobby',
        apiPath:   'hobbies',
        listId:    'hobbies-list',
        addBtnId:  'add-hobby-btn',
        modalId:   'hb-modal',
        backdropId:'hb-modal-backdrop',
        closeId:   'hb-modal-close',
        titleId:   'hb-modal-title',
        saveBtnId: 'hb-save-btn',
        statusId:  'hb-status',
        prefix:    'hb',
        stateKey:  'editingHobbyId',
        fields: [
          { key: 'name',        label: 'Name',        id: 'hb-name',        type: 'text' },
          { key: 'badge',       label: 'Badge',       id: 'hb-badge',       type: 'text' },
          { key: 'image_url',   label: 'Image URL',   id: 'hb-image_url',   type: 'text' },
          { key: 'url',         label: 'URL',         id: 'hb-url',         type: 'text' },
          { key: 'description', label: 'Description', id: 'hb-description', type: 'textarea' }
        ]
      },
      {
        type:      'projects',
        label:     'Project',
        apiPath:   'projects',
        listId:    'projects-list',
        addBtnId:  'add-project-btn',
        modalId:   'pr-modal',
        backdropId:'pr-modal-backdrop',
        closeId:   'pr-modal-close',
        titleId:   'pr-modal-title',
        saveBtnId: 'pr-save-btn',
        statusId:  'pr-status',
        prefix:    'pr',
        stateKey:  'editingProjectId',
        fields: [
          { key: 'name',        label: 'Name',        id: 'pr-name',        type: 'text' },
          { key: 'badge',       label: 'Badge',       id: 'pr-badge',       type: 'text' },
          { key: 'icon',        label: 'Icon',        id: 'pr-icon',        type: 'text' },
          { key: 'url',         label: 'URL',         id: 'pr-url',         type: 'text' },
          { key: 'description', label: 'Description', id: 'pr-description', type: 'textarea' }
        ]
      },
      {
        type:      'podcasts',
        label:     'Podcast',
        apiPath:   'podcasts',
        listId:    'podcasts-list',
        addBtnId:  'add-podcast-btn',
        modalId:   'pod-modal',
        backdropId:'pod-modal-backdrop',
        closeId:   'pod-modal-close',
        titleId:   'pod-modal-title',
        saveBtnId: 'pod-save-btn',
        statusId:  'pod-status',
        prefix:    'pod',
        stateKey:  'editingPodcastId',
        fields: [
          { key: 'name',        label: 'Name',                id: 'pod-name',        type: 'text' },
          { key: 'author',      label: 'Author',              id: 'pod-author',      type: 'text' },
          { key: 'artwork_url', label: 'Artwork URL',         id: 'pod-artwork_url', type: 'text' },
          { key: 'apple_url',   label: 'Apple Podcasts URL',  id: 'pod-apple_url',   type: 'text' },
          { key: 'url',         label: 'URL',                 id: 'pod-url',         type: 'text' },
          { key: 'description', label: 'Description',         id: 'pod-description', type: 'textarea' }
        ]
      }
    ];

    function getModalEl(cfg) { return document.getElementById(cfg.modalId); }
    function getBackdropEl(cfg) { return document.getElementById(cfg.backdropId); }
    function getStatusEl(cfg) { return document.getElementById(cfg.statusId); }
    function getModalTitleEl(cfg) { return document.getElementById(cfg.titleId); }

    function openModal(cfg) {
      var modal = getModalEl(cfg);
      var backdrop = getBackdropEl(cfg);
      if (modal) modal.style.display = 'flex';
      if (backdrop) backdrop.style.display = 'block';
    }

    function closeModal(cfg) {
      var modal = getModalEl(cfg);
      var backdrop = getBackdropEl(cfg);
      if (modal) modal.style.display = 'none';
      if (backdrop) backdrop.style.display = 'none';
      state[cfg.stateKey] = null;
    }

    function clearModalFields(cfg) {
      for (var fi = 0; fi < cfg.fields.length; fi++) {
        var el = document.getElementById(cfg.fields[fi].id);
        if (el) el.value = '';
      }
    }

    function prefillModalFields(cfg, item) {
      for (var fi = 0; fi < cfg.fields.length; fi++) {
        var field = cfg.fields[fi];
        var el = document.getElementById(field.id);
        if (el) el.value = item[field.key] || '';
      }
    }

    function gatherModalFields(cfg) {
      var data = {};
      for (var fi = 0; fi < cfg.fields.length; fi++) {
        var field = cfg.fields[fi];
        var el = document.getElementById(field.id);
        data[field.key] = el ? el.value.trim() : '';
      }
      return data;
    }

    function renderGearList(cfg, items) {
      var listEl = document.getElementById(cfg.listId);
      if (!listEl) return;
      listEl.textContent = '';
      if (!items || items.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'gear-empty';
        empty.textContent = 'No ' + cfg.label.toLowerCase() + ' items yet.';
        listEl.appendChild(empty);
        return;
      }
      for (var i = 0; i < items.length; i++) {
        listEl.appendChild(buildGearRow(cfg, items[i]));
      }
    }

    function buildGearRow(cfg, item) {
      var row = document.createElement('div');
      row.className = 'gear-row';

      var nameEl = document.createElement('span');
      nameEl.className = 'gear-row-name';
      nameEl.textContent = item.name || '(unnamed)';
      row.appendChild(nameEl);

      if (item.badge) {
        var badgeEl = document.createElement('span');
        badgeEl.className = 'gear-row-badge';
        badgeEl.textContent = item.badge;
        row.appendChild(badgeEl);
      }

      var actions = document.createElement('span');
      actions.className = 'gear-row-actions';

      var editBtn = document.createElement('button');
      editBtn.className = 'gear-btn gear-btn-edit';
      editBtn.textContent = '\u270e';
      editBtn.setAttribute('aria-label', 'Edit ' + (item.name || cfg.label));
      editBtn.addEventListener('click', function () {
        openGearEdit(cfg, item);
      });
      actions.appendChild(editBtn);

      var delBtn = document.createElement('button');
      delBtn.className = 'gear-btn gear-btn-del';
      delBtn.textContent = '\u2716';
      delBtn.setAttribute('aria-label', 'Delete ' + (item.name || cfg.label));
      delBtn.addEventListener('click', function () {
        deleteGearItem(cfg, item.id, item.name);
      });
      actions.appendChild(delBtn);

      row.appendChild(actions);
      return row;
    }

    function openGearAdd(cfg) {
      clearModalFields(cfg);
      var titleEl = getModalTitleEl(cfg);
      if (titleEl) titleEl.textContent = 'Add ' + cfg.label;
      state[cfg.stateKey] = null;
      openModal(cfg);
    }

    function openGearEdit(cfg, item) {
      prefillModalFields(cfg, item);
      var titleEl = getModalTitleEl(cfg);
      if (titleEl) titleEl.textContent = 'Edit ' + cfg.label;
      state[cfg.stateKey] = item.id;
      openModal(cfg);
    }

    function saveGearItem(cfg) {
      var data = gatherModalFields(cfg);
      var editingId = state[cfg.stateKey];
      var url, method;
      if (editingId) {
        url    = '/api/gear/' + cfg.apiPath + '/' + encodeURIComponent(editingId);
        method = 'PUT';
      } else {
        data.id = cfg.prefix + Date.now().toString(36);
        url    = '/api/gear/' + cfg.apiPath;
        method = 'POST';
      }
      fetch(url, {
        method:  method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Save failed'); });
        return res.json();
      }).then(function () {
        closeModal(cfg);
        reloadGearType(cfg);
        showStatus(getStatusEl(cfg), 'Saved', 'success');
      }).catch(function (err) {
        showStatus(getStatusEl(cfg), err.message, 'error');
      });
    }

    function deleteGearItem(cfg, id, name) {
      if (!window.confirm('Delete "' + (name || id) + '"?')) return;
      fetch('/api/gear/' + cfg.apiPath + '/' + encodeURIComponent(id), {
        method: 'DELETE'
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Delete failed'); });
        return res.json();
      }).then(function () {
        reloadGearType(cfg);
        showStatus(getStatusEl(cfg), 'Deleted', 'success');
      }).catch(function (err) {
        showStatus(getStatusEl(cfg), err.message, 'error');
      });
    }

    function reloadGearType(cfg) {
      fetch('/api/gear/' + cfg.apiPath).then(function (res) {
        return res.json();
      }).then(function (data) {
        var items = Array.isArray(data) ? data : (data.items || data.data || []);
        state[cfg.type] = items;
        renderGearList(cfg, items);
      }).catch(function (err) {
        console.warn('[admin] reload ' + cfg.type + ' failed:', err.message);
      });
    }

    function wireGearConfig(cfg) {
      var addBtn  = document.getElementById(cfg.addBtnId);
      var saveBtn = document.getElementById(cfg.saveBtnId);
      var closeEl = document.getElementById(cfg.closeId);
      var backdrop = getBackdropEl(cfg);

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          openGearAdd(cfg);
        });
      }
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          saveGearItem(cfg);
        });
      }
      if (closeEl) {
        closeEl.addEventListener('click', function () {
          closeModal(cfg);
        });
      }
      if (backdrop) {
        backdrop.addEventListener('click', function () {
          closeModal(cfg);
        });
      }
    }

    function loadGear() {
      var fetches = [];
      for (var i = 0; i < GEAR_CONFIG.length; i++) {
        fetches.push(
          fetch('/api/gear/' + GEAR_CONFIG[i].apiPath).then(function (res) {
            return res.json();
          })
        );
      }
      Promise.all(fetches).then(function (results) {
        for (var i = 0; i < GEAR_CONFIG.length; i++) {
          var cfg   = GEAR_CONFIG[i];
          var data  = results[i];
          var items = Array.isArray(data) ? data : (data.items || data.data || []);
          state[cfg.type] = items;
          renderGearList(cfg, items);
        }
      }).catch(function (err) {
        console.warn('[admin] loadGear failed:', err.message);
      });
    }

    // Wire up all 5 gear type modals + add buttons
    for (var gi = 0; gi < GEAR_CONFIG.length; gi++) {
      wireGearConfig(GEAR_CONFIG[gi]);
    }

    // ════════════════════════════════════════════════════════════
    // NOW TAB
    // ════════════════════════════════════════════════════════════

    var nowTextarea = document.getElementById('now-textarea');
    var nowSaveBtn  = document.getElementById('now-save-btn');
    var nowStatus   = document.getElementById('now-status');
    var nowUpdated  = document.getElementById('now-updated');

    function loadNow() {
      fetch('/api/gear/now').then(function (res) {
        return res.json();
      }).then(function (data) {
        if (nowTextarea) {
          nowTextarea.value = data.content || '';
        }
        if (nowUpdated && data.updated_at) {
          var d = new Date(data.updated_at);
          var updated = document.createElement('span');
          updated.textContent = 'Last updated: ' + d.toLocaleDateString();
          nowUpdated.textContent = '';
          nowUpdated.appendChild(updated);
        }
      }).catch(function (err) {
        console.warn('[admin] loadNow failed:', err.message);
      });
    }

    if (nowSaveBtn) {
      nowSaveBtn.addEventListener('click', function () {
        var content = nowTextarea ? nowTextarea.value : '';
        fetch('/api/content/now', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ content: content })
        }).then(function (res) {
          if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Save failed'); });
          return res.json();
        }).then(function (data) {
          showStatus(nowStatus, 'Saved', 'success');
          if (nowUpdated && data.updated_at) {
            var d = new Date(data.updated_at);
            var updated = document.createElement('span');
            updated.textContent = 'Last updated: ' + d.toLocaleDateString();
            nowUpdated.textContent = '';
            nowUpdated.appendChild(updated);
          }
        }).catch(function (err) {
          showStatus(nowStatus, err.message, 'error');
        });
      });
    }

  }); // end DOMContentLoaded

}());

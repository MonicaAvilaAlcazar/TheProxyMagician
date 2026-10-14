/* The Proxy Magician - options page (manage saved proxies). */
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const editor = $('editor');

  let profiles = [];
  let state = { mode: 'system' };
  let editingId = null;
  let selectedColor = PM.COLORS[0];

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------
  function button(label, className, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${className || ''}`.trim();
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderList() {
    const rows = $('rows');
    rows.replaceChildren();
    const full = profiles.length >= PM.MAX_PROFILES;

    $('count').textContent = `(${profiles.length}/${PM.MAX_PROFILES})`;
    $('addBtn').disabled = full;
    $('empty').classList.toggle('hidden', profiles.length > 0);
    $('limit').classList.toggle('hidden', !full);

    for (const p of profiles) {
      const active = state.mode === 'profile' && state.profileId === p.id;
      const li = document.createElement('li');
      li.className = 'row';

      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = p.color;

      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.name;
      if (active) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = 'Active';
        name.append(chip);
      }
      if (PM.hasAuth(p)) {
        const chip = document.createElement('span');
        chip.className = 'chip chip-muted';
        chip.textContent = 'Sign-in';
        name.append(chip);
      }
      const detail = document.createElement('span');
      detail.className = 'mono';
      detail.textContent = PM.describe(p);
      info.append(name, detail);

      const tools = document.createElement('div');
      tools.className = 'tools';
      if (!active) {
        tools.append(button('Use', 'btn-ghost', () => setState({ mode: 'profile', profileId: p.id })));
      }
      tools.append(
        button('Edit', '', () => openEditor(p)),
        button('Delete', 'btn-danger', () => removeProfile(p))
      );

      li.append(dot, info, tools);
      rows.append(li);
    }
  }

  async function renderGrantNotice() {
    const needs = profiles.some((p) => PM.hasAuth(p) && !p.scheme.startsWith('socks'));
    const granted = needs ? await PM.hasAuthPermission() : true;
    $('grantNotice').classList.toggle('hidden', granted);
  }

  async function load() {
    profiles = await PM.getProfiles();
    state = await PM.getState();
    renderList();
    await renderGrantNotice();
  }

  async function setState(next) {
    const res = await PM.send({ type: 'setState', state: next });
    if (!res || !res.ok) alert((res && res.error) || 'Could not change the proxy setting.');
    await load();
  }

  async function removeProfile(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await PM.saveProfiles(profiles.filter((x) => x.id !== p.id));
    await load();
  }

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------
  function renderSwatches() {
    const wrap = $('swatches');
    wrap.replaceChildren();
    PM.COLORS.forEach((color, i) => {
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'swatch';
      s.style.background = color;
      s.setAttribute('role', 'radio');
      s.setAttribute('aria-label', `Color ${i + 1}`);
      s.setAttribute('aria-checked', String(color === selectedColor));
      s.addEventListener('click', () => {
        selectedColor = color;
        renderSwatches();
      });
      wrap.append(s);
    });
  }

  function nextFreeColor() {
    const used = new Set(profiles.map((p) => p.color));
    return PM.COLORS.find((c) => !used.has(c)) || PM.COLORS[0];
  }

  function clearErrors() {
    form.querySelectorAll('.error').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function showErrors(errors) {
    clearErrors();
    let first = null;
    for (const [field, message] of Object.entries(errors)) {
      const el = form.querySelector(`.error[data-for="${field}"]`);
      if (el) {
        el.textContent = message;
        el.closest('.field').classList.add('invalid');
      }
      first = first || $(field);
    }
    if (first) first.focus();
  }

  function updateHints() {
    const scheme = $('scheme').value;
    $('port').placeholder = String(PM.DEFAULT_PORTS[scheme]);
    $('socksHint').classList.toggle('hidden', !scheme.startsWith('socks'));
  }

  function openEditor(profile) {
    if (!profile && profiles.length >= PM.MAX_PROFILES) return;
    editingId = profile ? profile.id : null;
    $('editorTitle').textContent = profile ? `Edit ${profile.name}` : 'Add proxy';
    $('name').value = profile ? profile.name : '';
    $('scheme').value = profile ? profile.scheme : 'http';
    $('host').value = profile ? profile.host : '';
    $('port').value = profile ? profile.port : '';
    $('username').value = profile ? profile.username : '';
    $('password').value = profile ? profile.password : '';
    $('password').type = 'password';
    $('bypass').value = (profile ? profile.bypassList : PM.DEFAULT_BYPASS).join('\n');
    selectedColor = profile ? profile.color : nextFreeColor();
    renderSwatches();
    updateHints();
    clearErrors();
    editor.showModal();
    $('name').focus();
  }

  function readForm() {
    return {
      id: editingId || undefined,
      name: $('name').value,
      color: selectedColor,
      scheme: $('scheme').value,
      host: $('host').value,
      port: $('port').value,
      username: $('username').value.trim(),
      password: $('password').value,
      bypassList: $('bypass').value
    };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = readForm();
    const errors = PM.validateProfile(data);
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }

    // Ask for the optional host permission while we still have the user
    // gesture. Resolves immediately if it was already granted.
    const permission = (data.username && !data.scheme.startsWith('socks'))
      ? PM.requestAuthPermission().catch(() => false)
      : Promise.resolve(true);

    const profile = PM.sanitizeProfile(data);
    const next = editingId
      ? profiles.map((p) => (p.id === editingId ? profile : p))
      : [...profiles, profile];

    try {
      await PM.saveProfiles(next);
    } catch (err) {
      showErrors({ name: err.message });
      return;
    }
    await permission;
    editor.close();
    await load();
  });

  $('cancelBtn').addEventListener('click', () => editor.close());
  $('scheme').addEventListener('change', updateHints);
  $('togglePw').addEventListener('click', () => {
    const show = $('password').type === 'password';
    $('password').type = show ? 'text' : 'password';
    $('togglePw').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    $('togglePw').title = show ? 'Hide password' : 'Show password';
  });
  $('addBtn').addEventListener('click', () => openEditor(null));
  $('grantBtn').addEventListener('click', async () => {
    await PM.requestAuthPermission().catch(() => false);
    await renderGrantNotice();
  });

  // -------------------------------------------------------------------------
  // Backup
  // -------------------------------------------------------------------------
  function feedback(text, ok) {
    const el = $('backupFeedback');
    el.textContent = text;
    el.className = `feedback ${ok ? 'ok' : 'bad'}`;
  }

  $('exportBtn').addEventListener('click', () => {
    if (!profiles.length) {
      feedback('There are no proxies to export yet.', false);
      return;
    }
    const withPasswords = $('exportPasswords').checked;
    const data = {
      app: 'the-proxy-magician',
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles: profiles.map(({ id, ...p }) => (withPasswords ? p : { ...p, password: '' }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxy-magician-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback(`Exported ${profiles.length} ${profiles.length === 1 ? 'proxy' : 'proxies'}.`, true);
  });

  $('exportPasswords').addEventListener('change', (event) => {
    $('exportWarning').classList.toggle('hidden', !event.target.checked);
  });

  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : data.profiles;
      if (!Array.isArray(incoming)) throw new Error('This file does not contain any proxies.');

      const valid = incoming.filter((p) => p && !Object.keys(PM.validateProfile(p)).length);
      const room = PM.MAX_PROFILES - profiles.length;
      const added = valid.slice(0, room).map((p) => PM.sanitizeProfile({ ...p, id: undefined }));
      if (!added.length) {
        throw new Error(room <= 0 ? 'Your list is full (10 proxies).' : 'No valid proxies found in this file.');
      }

      await PM.saveProfiles([...profiles, ...added]);
      await load();
      const skipped = incoming.length - added.length;
      feedback(`Imported ${added.length} ${added.length === 1 ? 'proxy' : 'proxies'}` +
        (skipped ? `, skipped ${skipped} (invalid or over the limit of 10).` : '.'), true);
    } catch (err) {
      feedback(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message, false);
    }
  });

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.profiles || changes.state)) load();
  });
  chrome.permissions.onAdded.addListener(renderGrantNotice);
  chrome.permissions.onRemoved.addListener(renderGrantNotice);

  $('version').textContent = `Version ${chrome.runtime.getManifest().version}.`;

  load().then(() => {
    if (location.hash === '#new') openEditor(null);
    if (location.hash === '#grant') $('grantBtn').focus();
    history.replaceState(null, '', location.pathname);
  });
})();

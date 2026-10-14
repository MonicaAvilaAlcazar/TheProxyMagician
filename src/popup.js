/* The Proxy Magician - toolbar popup. */
(() => {
  const $ = (id) => document.getElementById(id);
  const CHECK_SVG = '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  let profiles = [];
  let state = { mode: 'system' };

  function openOptions(hash = '') {
    chrome.tabs.create({ url: chrome.runtime.getURL(`src/options.html${hash}`) });
    window.close();
  }

  async function setState(next) {
    const res = await PM.send({ type: 'setState', state: next });
    if (!res || !res.ok) {
      showNotice('error', (res && res.error) || 'Could not change the proxy setting.');
      return;
    }
    state = res.state;
    await render();
  }

  function showNotice(kind, text, action) {
    const el = document.createElement('div');
    el.className = `notice notice-${kind}`;
    el.textContent = text;
    if (action) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = action.label;
      btn.addEventListener('click', action.onClick);
      el.append(document.createElement('br'), btn);
    }
    $('notices').append(el);
  }

  function renderStatus(active) {
    const status = $('status');
    status.classList.toggle('is-on', Boolean(active));
    if (active) {
      $('statusDot').style.background = active.color;
      status.style.setProperty('--dot-color', active.color);
      $('statusTitle').textContent = `Using ${active.name}`;
      $('statusDetail').textContent = PM.describe(active);
    } else if (state.mode === 'direct') {
      $('statusDot').style.background = '';
      $('statusTitle').textContent = 'Direct connection';
      $('statusDetail').textContent = 'No proxy is used';
    } else {
      $('statusDot').style.background = '';
      $('statusTitle').textContent = 'System proxy settings';
      $('statusDetail').textContent = 'Chrome uses your computer\'s settings';
    }
  }

  function renderProfiles() {
    const list = $('profileList');
    list.replaceChildren();
    $('count').textContent = `${profiles.length}/${PM.MAX_PROFILES}`;
    $('empty').classList.toggle('hidden', profiles.length > 0);
    $('addProxy').classList.toggle('hidden', profiles.length >= PM.MAX_PROFILES);

    for (const p of profiles) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'profile-btn';
      btn.setAttribute('aria-pressed', String(state.mode === 'profile' && state.profileId === p.id));
      btn.title = `Use ${p.name}`;

      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = p.color;

      const info = document.createElement('span');
      info.className = 'info';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.name;
      const detail = document.createElement('span');
      detail.className = 'mono';
      detail.textContent = PM.describe(p);
      info.append(name, detail);

      btn.append(dot, info);
      btn.insertAdjacentHTML('beforeend', CHECK_SVG);
      btn.addEventListener('click', () => setState({ mode: 'profile', profileId: p.id }));
      li.append(btn);
      list.append(li);
    }

    $('modeSystem').setAttribute('aria-pressed', String(state.mode === 'system'));
    $('modeDirect').setAttribute('aria-pressed', String(state.mode === 'direct'));
  }

  async function renderNotices(active) {
    $('notices').replaceChildren();

    const control = await chrome.proxy.settings.get({ incognito: false });
    if (control.levelOfControl === 'controlled_by_other_extensions') {
      showNotice('warn', 'Another extension is controlling your proxy. Disable it so The Proxy Magician can work.');
    } else if (control.levelOfControl === 'not_controllable') {
      showNotice('warn', 'Your proxy is managed by your organization or a policy and cannot be changed.');
    }

    if (!active) return;

    if (PM.hasAuth(active) && active.scheme.startsWith('socks')) {
      showNotice('warn', 'Chrome does not support usernames and passwords for SOCKS proxies.');
    } else if (PM.hasAuth(active) && !(await PM.hasAuthPermission())) {
      showNotice('warn', 'This proxy needs a password, but permission to sign in automatically was not granted.', {
        label: 'Fix in settings',
        onClick: () => openOptions('#grant')
      });
    }

    const { lastError } = await chrome.storage.local.get('lastError');
    if (lastError && Date.now() - lastError.time < 5 * 60 * 1000) {
      showNotice('error', `Proxy error: ${lastError.message}. Check the host, port and that the proxy is running.`);
    }
  }

  async function render() {
    profiles = await PM.getProfiles();
    state = await PM.getState();
    const active = state.mode === 'profile' ? profiles.find((p) => p.id === state.profileId) : null;
    renderStatus(active);
    renderProfiles();
    await renderNotices(active);
  }

  $('openOptions').addEventListener('click', () => openOptions());
  $('addProxy').addEventListener('click', () => openOptions('#new'));
  $('addFirst').addEventListener('click', () => openOptions('#new'));
  $('modeSystem').addEventListener('click', () => setState({ mode: 'system' }));
  $('modeDirect').addEventListener('click', () => setState({ mode: 'direct' }));

  render();
})();

/*
 * The Proxy Magician - background service worker.
 * Owns the browser proxy setting, the toolbar badge and proxy authentication.
 */
importScripts('shared.js');

const SCOPE = 'regular';

function buildConfig(profile) {
  return {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: profile.scheme,
        host: profile.host,
        port: Number(profile.port)
      },
      bypassList: profile.bypassList && profile.bypassList.length
        ? profile.bypassList
        : PM.DEFAULT_BYPASS
    }
  };
}

async function applyState(requested) {
  const profiles = await PM.getProfiles();
  let state = requested || { mode: 'system' };
  let profile = null;

  if (state.mode === 'profile') {
    profile = profiles.find((p) => p.id === state.profileId) || null;
    if (!profile) state = { mode: 'system' };
  }

  if (state.mode !== 'profile' && state.mode !== 'direct') state = { mode: 'system' };

  // Save the state before touching the proxy so the settings.onChange
  // listener (which refreshes the badge) already sees the new state.
  const previous = await PM.getState();
  await chrome.storage.local.set({ state, lastError: null });
  try {
    if (state.mode === 'profile') {
      await chrome.proxy.settings.set({ value: buildConfig(profile), scope: SCOPE });
    } else if (state.mode === 'direct') {
      await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: SCOPE });
    } else {
      await chrome.proxy.settings.clear({ scope: SCOPE });
    }
  } catch (err) {
    await chrome.storage.local.set({ state: previous });
    throw err;
  }

  await updateBadge(state, profile);
  return state;
}

async function updateBadge(state, profile) {
  let text = '';
  let color = '#78909c';
  let title = 'The Proxy Magician - using system proxy settings';

  if (state.mode === 'profile' && profile) {
    text = PM.badgeText(profile.name);
    color = profile.color;
    title = `The Proxy Magician - ${profile.name} (${PM.describe(profile)})`;
  } else if (state.mode === 'direct') {
    text = 'OFF';
    title = 'The Proxy Magician - direct connection (no proxy)';
  }

  const details = await chrome.proxy.settings.get({ incognito: false });
  if (details.levelOfControl === 'controlled_by_other_extensions' ||
      details.levelOfControl === 'not_controllable') {
    text = '!';
    color = '#ff1744';
    title = 'The Proxy Magician - another extension or a policy controls your proxy';
  }

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  if (chrome.action.setBadgeTextColor) {
    await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  }
  await chrome.action.setTitle({ title });
}

async function refreshBadge() {
  const state = await PM.getState();
  const profiles = await PM.getProfiles();
  const profile = state.mode === 'profile' ? profiles.find((p) => p.id === state.profileId) : null;
  await updateBadge(state, profile);
}

// ---------------------------------------------------------------------------
// Messages from the popup / options page
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'setState') {
    applyState(message.state)
      .then((state) => sendResponse({ ok: true, state }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
  return false;
});

// ---------------------------------------------------------------------------
// Keep the browser setting in sync when profiles are edited or deleted
// ---------------------------------------------------------------------------
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local' || !changes.profiles) return;
  const state = await PM.getState();
  if (state.mode === 'profile') {
    await applyState(state); // re-applies edits, falls back to system if deleted
  }
});

chrome.proxy.settings.onChange.addListener(() => {
  refreshBadge();
});

chrome.proxy.onProxyError.addListener(async (details) => {
  const state = await PM.getState();
  if (state.mode !== 'profile') return;
  await chrome.storage.local.set({
    lastError: { message: details.error || 'Proxy error', time: Date.now() }
  });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function restore() {
  const state = await PM.getState();
  try {
    await applyState(state);
  } catch (err) {
    console.error('The Proxy Magician: could not restore proxy state', err);
  }
}

chrome.runtime.onStartup.addListener(restore);
chrome.runtime.onInstalled.addListener(restore);

// ---------------------------------------------------------------------------
// Proxy authentication (HTTP/HTTPS proxies only - Chrome does not support
// SOCKS authentication). Requires the optional <all_urls> host permission,
// which is only requested when the user saves a proxy with a username.
// ---------------------------------------------------------------------------
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 2;

function onAuthRequired(details, callback) {
  if (!details.isProxy) {
    callback({});
    return;
  }
  (async () => {
    const state = await PM.getState();
    if (state.mode !== 'profile') return {};
    const profiles = await PM.getProfiles();
    const profile = profiles.find((p) => p.id === state.profileId);
    if (!PM.hasAuth(profile)) return {};

    const attempts = (authAttempts.get(details.requestId) || 0) + 1;
    authAttempts.set(details.requestId, attempts);
    // Stop after repeated failures so Chrome shows its own login prompt
    // instead of looping on wrong credentials.
    if (attempts > MAX_AUTH_ATTEMPTS) return {};

    return { authCredentials: { username: profile.username, password: profile.password } };
  })()
    .then(callback)
    .catch(() => callback({}));
}

function forgetRequest(details) {
  authAttempts.delete(details.requestId);
}

function registerAuthListeners() {
  const filter = { urls: ['<all_urls>'] };
  chrome.webRequest.onAuthRequired.removeListener(onAuthRequired);
  chrome.webRequest.onCompleted.removeListener(forgetRequest);
  chrome.webRequest.onErrorOccurred.removeListener(forgetRequest);
  chrome.webRequest.onAuthRequired.addListener(onAuthRequired, filter, ['asyncBlocking']);
  chrome.webRequest.onCompleted.addListener(forgetRequest, filter);
  chrome.webRequest.onErrorOccurred.addListener(forgetRequest, filter);
}

registerAuthListeners();
chrome.permissions.onAdded.addListener(registerAuthListeners);

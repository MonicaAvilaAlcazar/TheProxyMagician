/*
 * Shared helpers for The Proxy Magician.
 * Loaded as a classic script by the popup and options page, and via
 * importScripts() by the background service worker.
 */
const PM = (() => {
  const MAX_PROFILES = 10;
  const SCHEMES = ['http', 'https', 'socks4', 'socks5'];
  const DEFAULT_PORTS = { http: 8080, https: 443, socks4: 1080, socks5: 1080 };
  const DEFAULT_BYPASS = ['localhost', '127.0.0.1', '::1', '<local>'];
  const COLORS = [
    '#7c4dff', '#2979ff', '#00b8d4', '#00c853', '#aeea00',
    '#ffab00', '#ff6d00', '#ff1744', '#f50057', '#78909c'
  ];
  const AUTH_ORIGINS = { origins: ['<all_urls>'] };

  async function getProfiles() {
    const { profiles = [] } = await chrome.storage.local.get('profiles');
    return profiles;
  }

  async function saveProfiles(profiles) {
    if (profiles.length > MAX_PROFILES) {
      throw new Error(`You can save up to ${MAX_PROFILES} proxies.`);
    }
    await chrome.storage.local.set({ profiles });
  }

  // state: { mode: 'system' | 'direct' | 'profile', profileId?: string }
  async function getState() {
    const { state = { mode: 'system' } } = await chrome.storage.local.get('state');
    return state;
  }

  function newId() {
    return crypto.randomUUID();
  }

  function parseBypass(text) {
    return String(text || '')
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function hasAuth(profile) {
    return Boolean(profile && profile.username);
  }

  // Returns an object of field -> message. Empty object means valid.
  function validateProfile(p) {
    const errors = {};
    const name = String(p.name || '').trim();
    if (!name) errors.name = 'Give this proxy a name.';
    else if (name.length > 30) errors.name = 'Keep the name under 30 characters.';

    if (!SCHEMES.includes(p.scheme)) errors.scheme = 'Choose a proxy type.';

    const host = String(p.host || '').trim();
    if (!host) errors.host = 'Enter the proxy host or IP address.';
    else if (host.includes('://')) errors.host = 'Enter only the host, without http:// or socks5://.';
    else if (!/^(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9._-]+)$/.test(host)) errors.host = 'This host contains invalid characters.';

    const port = Number(p.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.port = 'Port must be a number from 1 to 65535.';

    return errors;
  }

  function sanitizeProfile(p) {
    return {
      id: p.id || newId(),
      name: String(p.name || '').trim().slice(0, 30),
      color: COLORS.includes(p.color) ? p.color : COLORS[0],
      scheme: SCHEMES.includes(p.scheme) ? p.scheme : 'http',
      host: String(p.host || '').trim(),
      port: Number(p.port),
      username: String(p.username || ''),
      password: String(p.password || ''),
      bypassList: Array.isArray(p.bypassList) ? p.bypassList.map(String) : parseBypass(p.bypassList)
    };
  }

  function describe(profile) {
    return `${profile.scheme}://${profile.host}:${profile.port}`;
  }

  function badgeText(name) {
    const clean = String(name || '').trim();
    return clean.slice(0, 3).toUpperCase() || 'ON';
  }

  function hasAuthPermission() {
    return chrome.permissions.contains(AUTH_ORIGINS);
  }

  // Must be called directly from a user gesture (click / submit).
  function requestAuthPermission() {
    return chrome.permissions.request(AUTH_ORIGINS);
  }

  function send(message) {
    return chrome.runtime.sendMessage(message);
  }

  return {
    MAX_PROFILES, SCHEMES, DEFAULT_PORTS, DEFAULT_BYPASS, COLORS,
    getProfiles, saveProfiles, getState, newId, parseBypass, hasAuth,
    validateProfile, sanitizeProfile, describe, badgeText,
    hasAuthPermission, requestAuthPermission, send
  };
})();

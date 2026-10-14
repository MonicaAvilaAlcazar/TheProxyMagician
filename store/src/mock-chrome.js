/* Minimal chrome.* mock so the real popup/options pages can be rendered for store screenshots. */
(() => {
  const data = {
    profiles: [
      { id: 'a', name: 'Work Office', color: '#7c4dff', scheme: 'http', host: 'proxy.acme-corp.com', port: 3128, username: 'jsmith', password: 'correct-horse', bypassList: ['localhost', '127.0.0.1', '::1', '<local>', '*.acme-corp.com'] },
      { id: 'b', name: 'Home Lab', color: '#00c853', scheme: 'socks5', host: '192.168.1.20', port: 1080, username: '', password: '', bypassList: ['localhost', '127.0.0.1', '::1', '<local>'] },
      { id: 'c', name: 'US East', color: '#2979ff', scheme: 'https', host: 'us-east.example.net', port: 443, username: '', password: '', bypassList: ['localhost', '127.0.0.1', '::1', '<local>'] },
      { id: 'd', name: 'Europe', color: '#ff6d00', scheme: 'socks5', host: 'eu.example.net', port: 1080, username: '', password: '', bypassList: ['localhost', '127.0.0.1', '::1', '<local>'] },
      { id: 'e', name: 'Debugging', color: '#f50057', scheme: 'http', host: '127.0.0.1', port: 8888, username: '', password: '', bypassList: ['<local>'] }
    ],
    state: { mode: 'profile', profileId: 'a' }
  };
  const noopEvent = { addListener() {}, removeListener() {} };
  const pick = (keys) => {
    if (typeof keys === 'string') keys = [keys];
    const out = {};
    for (const k of keys) if (k in data) out[k] = data[k];
    return out;
  };
  window.chrome = Object.assign(window.chrome || {}, {
    storage: {
      local: {
        get: async (keys) => pick(keys),
        set: async (obj) => { Object.assign(data, obj); }
      },
      onChanged: noopEvent
    },
    runtime: {
      getURL: (p) => p,
      getManifest: () => ({ version: '1.0.0' }),
      sendMessage: async (msg) => {
        if (msg.type === 'setState') data.state = msg.state;
        return { ok: true, state: data.state };
      }
    },
    proxy: { settings: { get: async () => ({ levelOfControl: 'controlled_by_this_extension' }) } },
    permissions: { contains: async () => true, request: async () => true, onAdded: noopEvent, onRemoved: noopEvent },
    tabs: { create() {} }
  });
})();

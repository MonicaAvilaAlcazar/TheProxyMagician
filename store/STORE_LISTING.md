# Chrome Web Store submission – The Proxy Magician

Copy each section below into the matching field of the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Package

Upload: `dist/the-proxy-magician-1.0.0.zip` (build it with `./scripts/package.sh`).

---

## Store listing tab

**Name** (from manifest)
The Proxy Magician

**Summary** (from manifest, max 132 characters)
Switch between up to 10 saved proxy servers in one click. HTTP, HTTPS, SOCKS4 and SOCKS5. Free, private, no tracking.

**Description**

```
The Proxy Magician makes switching proxies in Chrome effortless.

Save up to 10 proxy servers, give each one a name and a color, and switch between them with a single click from the toolbar. The toolbar badge always shows which proxy is active, so you never have to wonder how you're connected.

FEATURES
• Up to 10 saved proxies, each with its own name and color
• HTTP, HTTPS, SOCKS4 and SOCKS5 proxies
• One-click switching from the toolbar popup
• Badge shows the active proxy at a glance
• Automatic sign-in for HTTP/HTTPS proxies that need a username and password
• Bypass list per proxy (for example localhost, *.internal.com or 192.168.0.0/16)
• "System settings" and "Direct" modes to turn the proxy off
• Warns you if another extension or a policy is controlling your proxy
• Shows proxy connection errors so you know when something is wrong
• Export and import your proxies as a file (passwords optional)
• Light and dark mode

PRIVATE BY DESIGN
• Your proxies are stored only on your device
• No accounts, no servers, no analytics, no ads
• The extension makes no network requests of its own
• Free, with no paid tiers or in-app purchases

GOOD TO KNOW
• Chrome does not support usernames and passwords for SOCKS proxies. Use an HTTP or HTTPS proxy if yours requires sign-in.
• Automatic sign-in needs the optional "access to all sites" permission. It is only requested if you save a proxy with a username, and is used only to answer proxy login requests.
```

**Category**: Tools (under "Productivity") — or "Developer Tools" if you prefer.

**Language**: English

### Graphic assets (all in `store/assets/`)

| Field | File | Size |
| --- | --- | --- |
| Store icon | `store-icon-128.png` | 128×128 |
| Screenshots | `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png` | 1280×800 |
| Small promo tile | `promo-small.png` | 440×280 |
| Marquee promo tile (optional) | `promo-marquee.png` | 1400×560 |

### Additional fields

- **Official URL**: leave empty (only for a Search Console–verified domain you want to link)
- **Homepage URL**: https://monydevelop.me/projects/the-proxy-magician
- **Support URL**: https://github.com/MonicaAvilaAlcazar/TheProxyMagician/issues (support email: support@monydevelop.me)
- **Mature content**: No

---

## Privacy tab

**Single purpose description**

```
The Proxy Magician lets users save up to 10 proxy server configurations and switch Chrome's proxy setting between them, or turn the proxy off, in one click.
```

**Permission justifications**

`proxy`
```
Required to set Chrome's proxy configuration to the proxy server the user selects, and to turn the proxy off. This is the core function of the extension.
```

`storage`
```
Stores the user's saved proxy configurations (name, color, type, host, port, optional username/password and bypass list) and which proxy is active, locally on the device with chrome.storage.local.
```

`webRequest`
```
Used only to listen for chrome.webRequest.onAuthRequired events where isProxy is true, so the extension can supply the username and password the user saved for their proxy. Non-proxy authentication requests are ignored. No request content is read, modified, blocked or recorded.
```

`webRequestAuthProvider`
```
Required by Manifest V3 to respond asynchronously to proxy authentication challenges (onAuthRequired with asyncBlocking) with the credentials the user saved for the active proxy.
```

Host permission `<all_urls>` (optional_host_permissions)
```
Optional, and only requested when the user saves an HTTP/HTTPS proxy with a username. Chrome only delivers onAuthRequired events for URLs the extension has host access to, and a proxy can challenge any request, so access to all URLs is needed to answer proxy login prompts. The extension does not inject scripts, read page content, or modify any website.
```

**Remote code**: No, I am not using remote code. (All JavaScript is included in the package.)

**Data usage**

Leave every data type **unchecked**. The extension stores proxy settings (including optional proxy credentials) only on the user's device and never transmits them to the developer or any third party, which is not "collection" under the Chrome Web Store user data policy.

Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**

```
https://monydevelop.me/projects/the-proxy-magician/privacy
```

Keep it in sync with `PRIVACY.md` when the policy changes.

---

## Distribution tab

- **Payments**: Free of charge (no in-app purchases)
- **Visibility**: Public
- **Regions**: All regions

---

## Before you submit — checklist

- [x] Contact email set to support@monydevelop.me in `PRIVACY.md` and `docs/privacy.html`
- [x] Privacy policy published at https://monydevelop.me/projects/the-proxy-magician/privacy
- [ ] Register a developer account (one-time US$5 fee) and verify your contact email
- [ ] Run `./scripts/package.sh` and upload the zip
- [ ] Upload the images from `store/assets/`
- [ ] Fill in the Privacy tab using the text above
- [ ] Test the zip once with "Load unpacked" (see README) before submitting

Proxy extensions with broad permissions often get a closer manual review, so the first review can take several days.

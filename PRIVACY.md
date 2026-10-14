# Privacy Policy – The Proxy Magician

_Last updated: October 13, 2026_

The Proxy Magician is a free Chrome extension that lets you save up to 10 proxy servers and switch between them. This policy explains what the extension does with your information.

## The short version

The Proxy Magician does **not** collect, sell, share or send your data anywhere. It has no servers, no analytics, no ads and no trackers.

## What is stored, and where

When you save a proxy, the extension stores the following **only on your device**, in Chrome's local extension storage (`chrome.storage.local`):

- the name and color you choose for the proxy
- the proxy type, host and port
- the username and password, if you enter them
- your bypass list (addresses that should not use the proxy)
- which proxy is currently active

This data is never synced to your Google account by the extension and never sent to the developer or any third party. Passwords are stored unencrypted in local extension storage, the same as most proxy extensions, so anyone with access to your computer account could read them. Uninstalling the extension deletes all of this data.

## Network traffic

The extension makes **no network requests of its own**. When you turn on a proxy, Chrome sends your browsing traffic through the proxy server **you** configured. That proxy's operator can see your traffic according to their own policies; The Proxy Magician has no control over or access to it.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `proxy` | To change Chrome's proxy settings to the proxy you select. |
| `storage` | To save your proxies on your device. |
| `webRequest`, `webRequestAuthProvider` | To answer a proxy's login request with the username and password you saved. |
| Access to all sites (optional) | Only requested if you save a proxy with a username. Chrome requires it to answer proxy login requests. The extension does not read, change or record the content of any website. |

## Export files

If you use **Export to file**, a JSON file with your proxies is saved to your computer. Passwords are left out unless you tick **Include passwords**. You are responsible for keeping that file safe.

## Children

The extension does not knowingly collect any information from anyone, including children.

## Changes

If this policy changes, the new version will be published at this same address with a new "Last updated" date.

## Contact

Questions about this policy: [support@monydevelop.me](mailto:support@monydevelop.me)

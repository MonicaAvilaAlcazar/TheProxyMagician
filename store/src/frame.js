/*
 * Loads a real extension page (../../src/<page>) into an iframe with the chrome.* mock injected.
 * Needs Chrome started with --allow-file-access-from-files (see scripts/render-assets.sh).
 */
function mountExtensionPage(iframe, page, afterLoad) {
  const base = new URL('../../src/', location.href).href;
  const mock = new URL('mock-chrome.js', location.href).href;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', base + page, false);
  xhr.send();
  const html = xhr.responseText
    .replace('<head>', `<head><base href="${base}">`)
    .replace('<script src="shared.js">', `<script src="${mock}"></script><script src="shared.js">`);
  iframe.addEventListener('load', () => {
    setTimeout(() => {
      const doc = iframe.contentDocument;
      if (iframe.dataset.autoHeight) iframe.style.height = doc.documentElement.scrollHeight + 'px';
      if (afterLoad) afterLoad(doc);
    }, 150);
  }, { once: true });
  iframe.srcdoc = html;
}

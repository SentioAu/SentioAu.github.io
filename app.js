/* SentioAurum — minimal studio landing. */
(function () {
  'use strict';

  // Trigger the staggered entrance once styles are in.
  requestAnimationFrame(function () {
    document.body.classList.add('ready');
  });

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Measure outbound clicks to the network — which tool, from where, to where.
  // `network_product` is the key dimension: register it as a GA4 custom
  // dimension to break clicks down per tool. GA4 already records where the
  // visitor came from (session source/medium) automatically.
  document.querySelectorAll('.track-network').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag !== 'function') { return; }
      var product = link.getAttribute('data-network') || link.textContent.trim();
      var params = {
        network_product: product,
        link_url: link.href,
        link_domain: (function () { try { return new URL(link.href).hostname; } catch (e) { return ''; } })(),
        source_section: link.closest('.index-list') ? 'network_index' : 'studio_mention',
        outbound: true
      };
      // Custom event for per-tool reporting…
      gtag('event', 'network_click', params);
      // …plus GA4's recommended select_content so it shows without setup.
      gtag('event', 'select_content', { content_type: 'network_tool', item_id: product });
    });
  });

  // Measure enquiry (mailto) clicks.
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'contact_click', { method: 'email' });
      }
    });
  });
})();

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

  // Measure outbound clicks to the network.
  document.querySelectorAll('.track-network').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'network_click', {
          network_product: link.getAttribute('data-network') || link.textContent.trim(),
          destination: link.href
        });
      }
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

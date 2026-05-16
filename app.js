    const domainGrid = document.getElementById('domainGrid');
    const filterRow = document.getElementById('filterRow');
    const tldRow = document.getElementById('tldRow');
    const domainField = document.getElementById('domainField');
    const domainPicker = document.getElementById('domainPicker');
    const domainSearch = document.getElementById('domainSearch');
    const domainSearchHint = document.getElementById('domainSearchHint');
    const inquiryForm = document.getElementById('inquiryForm');
    const offerIntent = document.getElementById('offerIntent');
    const budgetField = document.getElementById('budgetField');
    const emailField = document.getElementById('emailField');
    const shortlistText = document.getElementById('shortlistText');
    const shortlistInput = document.getElementById('shortlistInput');
    const clearShortlistBtn = document.getElementById('clearShortlistBtn');
    const inquireShortlistBtn = document.getElementById('inquireShortlistBtn');

    const trackEvent = (name, params = {}) => {
      if (typeof gtag === 'function') {
        gtag('event', name, params);
      }
    };

    const optionMarkup = (domain) => `<option value="${domain}">${domain}</option>`;

    const briefUrlFor = (name) => `/domains/${name.toLowerCase().replace(/\./g, '-')}.html`;

    const weeklySeed = () => {
      const now = new Date();
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - startOfYear.getTime()) / 86400000);
      return now.getUTCFullYear() * 100 + Math.floor(dayOfYear / 7);
    };

    const seededShuffle = (items, seed) => {
      const arr = [...items];
      let state = seed || 1;
      for (let i = arr.length - 1; i > 0; i -= 1) {
        state = (state * 1664525 + 1013904223) % 4294967296;
        const j = state % (i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const setDomainSelection = (domain) => {
      domainField.value = domain;
      domainPicker.value = domain;
    };

    const shortlist = new Set(JSON.parse(localStorage.getItem('sentio_shortlist') || '[]'));
    let activeCategory = 'All';
    let activeTld = 'All';
    let activeQuery = '';
    let allDomains = [];
    const MAX_GRID_RESULTS = 12;
    const TLD_MIN_COUNT = 2;

    const tldOf = (name) => {
      const parts = name.toLowerCase().split('.');
      if (parts.length < 2) return '';
      return '.' + parts.slice(1).join('.');
    };

    const debounce = (callback, delay = 180) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
    };

    const syncShortlist = () => {
      const items = [...shortlist];
      shortlistText.textContent = items.length > 0 ? items.join(', ') : 'No domains selected yet.';
      shortlistInput.value = items.join(', ');
      inquireShortlistBtn.disabled = items.length === 0;
      localStorage.setItem('sentio_shortlist', JSON.stringify(items));
    };

    const updateSearchHint = (visibleCount, query = '') => {
      if (!domainSearchHint) {
        return;
      }

      const trimmed = query.trim();
      const filterParts = [];
      if (activeCategory !== 'All') filterParts.push(activeCategory);
      if (activeTld !== 'All') filterParts.push(activeTld);
      const scope = filterParts.length ? ` in ${filterParts.join(' / ')}` : '';

      if (!trimmed) {
        domainSearchHint.textContent = filterParts.length
          ? `Showing ${visibleCount} domain${visibleCount === 1 ? '' : 's'}${scope}.`
          : `Showing all ${allDomains.length} domains.`;
        return;
      }

      domainSearchHint.textContent = visibleCount === 0
        ? `No matches for "${trimmed}"${scope}.`
        : `Showing ${visibleCount} match${visibleCount === 1 ? '' : 'es'} for "${trimmed}"${scope}.`;
    };

    const makeCategoryButton = (category) => `
      <button class="filter-chip${category === activeCategory ? ' is-active' : ''}" type="button" data-category="${category}">${category}</button>
    `;

    const popularTlds = () => {
      const counts = new Map();
      for (const item of allDomains) {
        const t = tldOf(item.name);
        counts.set(t, (counts.get(t) || 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, n]) => n >= TLD_MIN_COUNT)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t);
    };

    const matchesTldFilter = (name) => {
      if (activeTld === 'All') return true;
      const t = tldOf(name);
      if (activeTld === 'Other') {
        return !popularTlds().includes(t);
      }
      return t === activeTld;
    };

    const getFilteredDomains = () => {
      const q = activeQuery.trim().toLowerCase();
      return allDomains.filter((item) => {
        const matchesCategory = activeCategory === 'All' || (item.category || 'Portfolio Domain') === activeCategory;
        if (!matchesCategory) return false;
        if (!matchesTldFilter(item.name)) return false;
        if (!q) return true;
        return item.name.toLowerCase().includes(q);
      });
    };


    const populateDomainOptions = (visible) => {
      const options = visible.map((item) => optionMarkup(item.name)).join('');
      domainField.innerHTML = '<option value="" selected disabled>Select a domain</option>';
      domainPicker.innerHTML = '<option value="" selected>Select a domain</option>';
      domainField.insertAdjacentHTML('beforeend', options);
      domainPicker.insertAdjacentHTML('beforeend', options);
      updateSearchHint(visible.length, activeQuery);
    };

    const attachCardEvents = () => {
      document.querySelectorAll('button[data-domain]').forEach((button) => {
        button.addEventListener('click', () => {
          const domain = button.getAttribute('data-domain');
          setDomainSelection(domain);
          document.getElementById('inquire').scrollIntoView({ behavior: 'smooth', block: 'start' });
          domainField.focus();
          trackEvent('domain_select', {
            domain_name: domain,
            source_section: 'featured_domains'
          });
        });
      });

      document.querySelectorAll('button[data-shortlist]').forEach((button) => {
        button.addEventListener('click', () => {
          const domain = button.getAttribute('data-shortlist');
          if (shortlist.has(domain)) {
            shortlist.delete(domain);
          } else {
            shortlist.add(domain);
          }
          syncShortlist();
          trackEvent('shortlist_update', {
            domain_name: domain,
            shortlist_count: shortlist.size
          });
        });
      });

      document.querySelectorAll('.brief-link').forEach((link) => {
        link.addEventListener('click', () => {
          trackEvent('domain_brief_view', {
            domain_name: link.getAttribute('data-domain') || 'unknown',
            source_section: 'featured_domains'
          });
        });
      });
    };

    const pickFeaturedSet = (pool) => {
      const seed = weeklySeed();
      const featured = pool.filter((item) => item.featured === true);
      const rest = pool.filter((item) => item.featured !== true);
      const ordered = [...seededShuffle(featured, seed), ...seededShuffle(rest, seed + 1)];
      return ordered.slice(0, 4);
    };

    const pickGridDomains = (filtered) => {
      const isSearching = activeQuery.trim().length > 0;
      if (isSearching) {
        return filtered.slice(0, MAX_GRID_RESULTS);
      }
      return pickFeaturedSet(filtered.length > 0 ? filtered : allDomains);
    };

    const renderFeaturedDomains = () => {
      const filtered = getFilteredDomains();
      const rotatedDomains = pickGridDomains(filtered);

      if (rotatedDomains.length === 0) {
        domainGrid.innerHTML = `<article class="card domain-card"><h3>No matches</h3><p>No domains match the current filter. Try a different category or clear your search.</p></article>`;
        attachCardEvents();
        return;
      }

      domainGrid.innerHTML = rotatedDomains.map((item) => {
        const description = item.description && item.description.trim().length > 0
          ? item.description
          : `${item.name} is available in the SentioAurum portfolio.`;
        const briefLink = `<a class="brief-link" data-domain="${item.name}" href="${briefUrlFor(item.name)}">View domain brief →</a>`;
        const category = item.category || 'Portfolio Domain';
        const subcategory = item.subcategory ? `<span class="subcat-badge">${item.subcategory}</span>` : '';
        return `
          <article class="card domain-card">
            <p class="card-eyebrow">${category}${subcategory}</p>
            <h3>${item.name}</h3>
            <p>${description}</p>
            ${briefLink}
            <div class="domain-actions">
              <button class="btn small" data-domain="${item.name}">Inquire</button>
              <button class="btn btn-ghost small" type="button" data-shortlist="${item.name}">Shortlist</button>
            </div>
          </article>
        `;
      }).join('');

      attachCardEvents();
    };

    const renderFilters = () => {
      const categories = ['All', ...new Set(allDomains.map((item) => item.category || 'Portfolio Domain'))];
      filterRow.innerHTML = categories.map((category) => makeCategoryButton(category)).join('');

      filterRow.querySelectorAll('button[data-category]').forEach((button) => {
        button.addEventListener('click', () => {
          activeCategory = button.getAttribute('data-category');
          renderAll();
          trackEvent('domain_filter_select', { category: activeCategory });
        });
      });
    };

    const makeTldButton = (label) => `
      <button class="filter-chip${label === activeTld ? ' is-active' : ''}" type="button" data-tld="${label}">${label}</button>
    `;

    const renderTldFilters = () => {
      if (!tldRow) return;
      const popular = popularTlds();
      const hasOther = allDomains.some((item) => !popular.includes(tldOf(item.name)));
      const labels = ['All', ...popular, ...(hasOther ? ['Other'] : [])];
      tldRow.innerHTML = labels.map((label) => makeTldButton(label)).join('');

      tldRow.querySelectorAll('button[data-tld]').forEach((button) => {
        button.addEventListener('click', () => {
          activeTld = button.getAttribute('data-tld');
          renderAll();
          trackEvent('domain_tld_select', { tld: activeTld });
        });
      });
    };

    const renderAll = () => {
      const filtered = getFilteredDomains();
      renderFilters();
      renderTldFilters();
      renderFeaturedDomains();
      populateDomainOptions(filtered);
    };

    const requiredFields = [domainField, offerIntent, budgetField, emailField];
    let formStarted = false;

    syncShortlist();

    requiredFields.forEach((field) => {
      field.addEventListener('focus', () => {
        if (!formStarted) {
          formStarted = true;
          trackEvent('form_start', { form_name: 'inquiry_form' });
        }
      });
    });

    fetch('domains.json')
      .then((response) => response.json())
      .then((domains) => {
        allDomains = domains;
        renderAll();
      })
      .catch(() => {
        domainGrid.innerHTML = '<article class="card domain-card"><h3>Domain list unavailable</h3><p>Please use the full Atom portfolio link while we refresh inventory sync.</p></article>';
      });

    inquireShortlistBtn.addEventListener('click', () => {
      const items = [...shortlist];
      if (items.length === 0) {
        trackEvent('shortlist_inquiry_click', { shortlist_count: 0, status: 'empty' });
        return;
      }

      setDomainSelection(items[0]);
      shortlistInput.value = items.join(', ');
      document.getElementById('inquire').scrollIntoView({ behavior: 'smooth', block: 'start' });
      domainField.focus();
      trackEvent('shortlist_inquiry_click', {
        shortlist_count: items.length,
        first_domain: items[0]
      });
    });

    clearShortlistBtn.addEventListener('click', () => {
      shortlist.clear();
      syncShortlist();
      trackEvent('shortlist_update', { domain_name: 'cleared', shortlist_count: 0 });
    });

    const debouncedDomainSearch = debounce(() => {
      const previous = activeQuery;
      activeQuery = domainSearch.value;
      renderAll();
      const q = activeQuery.trim();
      if (q.length > 0 && q !== previous.trim()) {
        trackEvent('domain_search', {
          query_length: q.length,
          results_count: getFilteredDomains().length,
          category_filter: activeCategory
        });
      }
    });

    domainSearch.addEventListener('input', debouncedDomainSearch);

    domainPicker.addEventListener('change', () => {
      const selectedDomain = domainPicker.value;
      if (!selectedDomain) {
        return;
      }
      setDomainSelection(selectedDomain);
      document.getElementById('inquire').scrollIntoView({ behavior: 'smooth', block: 'start' });
      trackEvent('domain_select', {
        domain_name: selectedDomain,
        source_section: 'domain_selector'
      });
    });

    domainField.addEventListener('change', () => {
      if (domainField.value) {
        domainPicker.value = domainField.value;
      }
    });

    document.querySelectorAll('.track-project').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('project_click', {
          project_url: link.href,
          source_section: 'projects'
        });
      });
    });

    document.querySelectorAll('.track-atom').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('portfolio_click', {
          destination: link.href
        });
      });
    });

    document.querySelectorAll('.partner-badge[href]').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('partner_click', {
          partner: link.textContent.trim(),
          destination: link.href
        });
      });
    });

    inquiryForm.addEventListener('submit', () => {
      const missing = requiredFields.filter((field) => !field.value);
      if (missing.length > 0) {
        trackEvent('form_error', {
          form_name: 'inquiry_form',
          missing_count: missing.length
        });
        return;
      }

      trackEvent('inquiry_submit', {
        domain_name: domainField.value || 'not_selected',
        offer_intent: offerIntent.value || 'not_selected',
        budget_range: budgetField.value || 'not_selected',
        shortlist_count: shortlist.size,
        category_filter: activeCategory
      });
    });

    const optionalDetails = document.getElementById('optionalDetails');
    if (optionalDetails) {
      optionalDetails.addEventListener('toggle', () => {
        if (optionalDetails.open) {
          trackEvent('form_optional_expand', { form_name: 'inquiry_form' });
        }
      });
    }

    document.getElementById('year').textContent = new Date().getFullYear();

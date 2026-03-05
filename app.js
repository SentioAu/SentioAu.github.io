    const domainGrid = document.getElementById('domainGrid');
    const filterRow = document.getElementById('filterRow');
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

const DOMAIN_BRIEFS = {
      'cryptoguide.ai': '/domains/cryptoguide-ai.html',
      'snuggle.ai': '/domains/snuggle-ai.html',
      'advantech.ai': '/domains/advantech-ai.html',
      'hunted.ai': '/domains/hunted-ai.html',
      'nub.ai': '/domains/nub-ai.html',
      'dragonfall.com': '/domains/dragonfall-com.html',
      'witchingly.com': '/domains/witchingly-com.html',
      'chesscourse.com': '/domains/chesscourse-com.html',
      'thehiveai.com': '/domains/thehiveai-com.html'
    };

    const shuffle = (items) => {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
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
    let allDomains = [];

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
      if (!trimmed) {
        domainSearchHint.textContent = `Showing all ${allDomains.length} domains.`;
        return;
      }

      domainSearchHint.textContent = visibleCount === 0
        ? `No matches for "${trimmed}".`
        : `Showing ${visibleCount} match${visibleCount === 1 ? '' : 'es'} for "${trimmed}".`;
    };

    const makeCategoryButton = (category) => `
      <button class="filter-chip${category === activeCategory ? ' is-active' : ''}" type="button" data-category="${category}">${category}</button>
    `;

    const getFilteredDomains = () => {
      if (activeCategory === 'All') {
        return allDomains;
      }
      return allDomains.filter((item) => (item.category || 'Portfolio Domain') === activeCategory);
    };


    const populateDomainOptions = (domains, filterTerm = '') => {
      const q = filterTerm.trim().toLowerCase();
      const visible = q ? domains.filter((item) => item.name.toLowerCase().includes(q)) : domains;
      const options = visible.map((item) => optionMarkup(item.name)).join('');

      domainField.innerHTML = '<option value="" selected disabled>Select a domain</option>';
      domainPicker.innerHTML = '<option value="" selected>Select a domain</option>';
      domainField.insertAdjacentHTML('beforeend', options);
      domainPicker.insertAdjacentHTML('beforeend', options);
      updateSearchHint(visible.length, filterTerm);

      if (q.length > 0) {
        trackEvent('domain_search', { query_length: q.length, results_count: visible.length });
      }
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

    const renderFeaturedDomains = () => {
      const filtered = getFilteredDomains();
      const source = filtered.length > 0 ? filtered : allDomains;
      const rotatedDomains = shuffle(source).slice(0, 4);

      domainGrid.innerHTML = rotatedDomains.map((item) => {
        const description = item.description && item.description.trim().length > 0
          ? item.description
          : `${item.name} is available in the SentioAurum portfolio.`;
        const briefUrl = DOMAIN_BRIEFS[item.name.toLowerCase()];
        const briefLink = briefUrl
          ? `<a class="brief-link" data-domain="${item.name}" href="${briefUrl}">View domain brief →</a>`
          : '';
        return `
          <article class="card domain-card">
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
          renderFilters();
          renderFeaturedDomains();
          trackEvent('domain_filter_select', { category: activeCategory });
        });
      });
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
        populateDomainOptions(domains);
        renderFilters();
        renderFeaturedDomains();
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
      populateDomainOptions(allDomains, domainSearch.value);
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

    document.getElementById('year').textContent = new Date().getFullYear();

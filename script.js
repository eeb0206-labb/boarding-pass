/* ================================================
   BOARDING PASS — "Stamped Journal" JS
   ================================================ */

/* ─── CONFIG ─── */
var NTFY_TOPIC = 'boarding-pass-je';  // CHANGE THIS to your own unique ntfy topic

/* ── ntfy.sh visitor notifications ── */
(function () {
  if (!NTFY_TOPIC) return;
  var sessionTag = Math.random().toString(36).slice(2, 6).toUpperCase();
  var startTime = Date.now();

  var parseReferrer = function (ref) {
    if (!ref) return 'Direct / typed URL';
    try {
      var host = new URL(ref).hostname.replace(/^www\./, '');
      var known = {
        'linkedin.com': 'LinkedIn', 'google.com': 'Google', 'google.co.uk': 'Google',
        't.co': 'Twitter / X', 'twitter.com': 'Twitter / X', 'x.com': 'Twitter / X',
        'instagram.com': 'Instagram', 'facebook.com': 'Facebook', 'reddit.com': 'Reddit',
        'bing.com': 'Bing'
      };
      return known[host] || host;
    } catch (e) { return 'Unknown'; }
  };

  var parseDevice = function (ua) {
    if (!ua) return '';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android';
    if (/Macintosh/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Linux/i.test(ua)) return 'Linux';
    return '';
  };

  var formatDuration = function (ms) {
    var secs = Math.round(ms / 1000);
    if (secs < 60) return secs + ' sec';
    var mins = Math.floor(secs / 60);
    var rem = secs % 60;
    return rem > 0 ? mins + ' min ' + rem + ' sec' : mins + ' min';
  };

  var sendNotif = function (loc) {
    var city = (loc && loc.city) || '';
    var region = (loc && loc.region) || '';
    var postal = (loc && loc.postal) || '';
    var countryCode = (loc && loc.country_code) || '';
    var flag = countryCode
      ? String.fromCodePoint.apply(null, countryCode.split('').map(function (c) { return 0x1F1E6 + c.charCodeAt(0) - 65; }))
      : '';
    var parts = [postal, city, region].filter(Boolean);
    var where = parts.length > 0 ? flag + ' ' + parts.join(', ') : 'Unknown location';

    var org = (loc && loc.org) || '';
    org = org.replace(/^AS\d+\s+/, '').trim();

    var refSource = parseReferrer(document.referrer);
    var device = parseDevice(navigator.userAgent);

    var body = [
      'Someone is viewing Boarding Pass',
      where,
      org ? org : '',
      refSource ? 'From: ' + refSource : '',
      device,
      sessionTag
    ].filter(Boolean).join('\n');

    var qs = new URLSearchParams({ title: 'Boarding Pass', priority: 'default', tags: 'airplane' });
    var mapParts = [postal, city, region].filter(Boolean);
    var actionBtns = [];
    if (mapParts.length > 0) {
      var mapQuery = encodeURIComponent(mapParts.join(', '));
      actionBtns.push('view, Map, https://www.google.com/maps/search/' + mapQuery);
      var agencyQuery = encodeURIComponent('travel company ' + [postal, city].filter(Boolean).join(' '));
      actionBtns.push('view, Companies, https://www.google.com/search?q=' + agencyQuery);
    }
    if (actionBtns.length > 0) qs.set('actions', actionBtns.join('; '));

    fetch('https://ntfy.sh/' + NTFY_TOPIC + '?' + qs, { method: 'POST', body: body })
      .then(function (r) { console.log('[ntfy] sent:', r.status); })
      .catch(function (e) { console.error('[ntfy] failed:', e); });

    window.addEventListener('pagehide', function () {
      var ms = Date.now() - startTime;
      if (ms < 15000) return;
      var qs2 = new URLSearchParams({ title: 'Boarding Pass', priority: 'low', tags: 'timer' });
      navigator.sendBeacon('https://ntfy.sh/' + NTFY_TOPIC + '?' + qs2,
        'Spent ' + formatDuration(ms) + ' on the site\n' + sessionTag);
    }, { once: true });
  };

  try {
    fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (loc) { sendNotif(loc); })
      .catch(function () { sendNotif(null); });
  } catch (e) {
    sendNotif(null);
  }
})();


/* ── 0b. D3 world map — visited countries highlighted ── */
(function () {
  var mapEl = document.getElementById('world-map');
  if (!mapEl || typeof d3 === 'undefined') return;

  /*
    ADD COUNTRIES HERE: use ISO 3166-1 numeric codes.
    Find codes at: https://en.wikipedia.org/wiki/ISO_3166-1_numeric
  */
  var visitedIds = {
    826: 'United Kingdom',
    250: 'France',
    724: 'Spain',
    380: 'Italy',
    300: 'Greece',
    788: 'Tunisia',
    764: 'Thailand'
  };

  var tooltip = document.getElementById('map-tooltip');

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(function (r) { return r.json(); })
    .then(function (world) {
      var countries = topojson.feature(world, world.objects.countries);

      var width = 960;
      var height = 480;
      var projection = d3.geoNaturalEarth1().fitSize([width, height], countries);
      var path = d3.geoPath().projection(projection);

      var svg = d3.select('#world-map')
        .append('svg')
        .attr('viewBox', '0 0 ' + width + ' ' + height);

      svg.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', function (d) {
          return 'country' + (visitedIds[+d.id] ? ' visited' : '');
        })
        .on('mouseover', function (event, d) {
          var name = visitedIds[+d.id];
          if (!name) return;
          tooltip.textContent = name;
          tooltip.classList.add('visible');
        })
        .on('mousemove', function (event) {
          tooltip.style.left = event.clientX + 'px';
          tooltip.style.top = event.clientY + 'px';
        })
        .on('mouseout', function () {
          tooltip.classList.remove('visible');
        });
    });
})();

/* ── 0c. Scroll-reveal system (.reveal elements fade up when visible) ── */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  var obs = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add('visible');
      obs.unobserve(entries[i].target);
    }
  }, { threshold: 0.1 });

  for (var i = 0; i < els.length; i++) {
    obs.observe(els[i]);
  }
})();

/* ── 1. Stamp press animation via IntersectionObserver ── */
(function () {
  var stamps = document.querySelectorAll('.stamp');
  if (!stamps.length) return;

  var obs = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      var el = entries[i].target;
      var idx = Array.prototype.indexOf.call(stamps, el);
      (function (target, delay) {
        setTimeout(function () { target.classList.add('stamped'); }, delay);
      })(el, (idx % 3) * 200 + 300);
      obs.unobserve(el);
    }
  }, { threshold: 0.1 });

  for (var i = 0; i < stamps.length; i++) {
    obs.observe(stamps[i]);
  }
})();

/* ── 2. Plane divider fly animation ── */
(function () {
  var plane = document.getElementById('plane-divider');
  if (!plane) return;

  var obs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      plane.classList.add('flying');
      obs.disconnect();
    }
  }, { threshold: 0.3 });

  obs.observe(plane);
})();

/* ── 3. Crew cards slide-in ── */
(function () {
  var cards = document.querySelectorAll('.crew-card.slide-in');
  if (!cards.length) return;

  var obs = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      var el = entries[i].target;
      el.classList.add('visible');
      obs.unobserve(el);
    }
  }, { threshold: 0.12 });

  for (var i = 0; i < cards.length; i++) {
    obs.observe(cards[i]);
  }
})();

/* ── 4. Lightbox — click work item to open fullscreen ── */
(function () {
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  var lbImg = lightbox.querySelector('.lightbox-img');
  var lbTitle = lightbox.querySelector('.lightbox-title');
  var lbBrief = lightbox.querySelector('.lightbox-brief');
  var lbType = lightbox.querySelector('.lightbox-type');
  var lbClose = lightbox.querySelector('.lightbox-close');

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.work-item');
    if (!item) return;
    var img = item.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbTitle.textContent = item.dataset.title || '';
    lbBrief.textContent = item.dataset.brief || '';
    var typeEl = item.querySelector('.work-type');
    lbType.textContent = typeEl ? typeEl.textContent : '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeLb() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLb();
  });
})();

/* ── 6. Smooth scroll ── */
(function () {
  var links = document.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var nav = document.querySelector('.nav');
      var offset = (nav ? nav.offsetHeight : 0) + 16;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
      var open = document.querySelector('.nav-links.open');
      if (open) open.classList.remove('open');
    });
  }
})();

/* ── 7. Nav shadow on scroll ── */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    nav.style.boxShadow = window.scrollY > 30 ? '0 2px 20px rgba(120,90,40,.1)' : 'none';
  }, { passive: true });
})();

/* ── 8. Mobile nav toggle ── */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', function () {
    links.classList.toggle('open');
  });
})();

/* ── 9. Logo banner — duplicate for seamless loop ── */
(function () {
  var track = document.querySelector('.logo-track');
  if (!track) return;
  track.innerHTML = track.innerHTML + track.innerHTML;
})();

/* ── 10. Deploy button — localhost only ── */
(function () {
  var btn = document.getElementById('deploy-btn');
  if (!btn) return;
  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isLocal) return;
  btn.style.display = 'block';

  btn.addEventListener('click', function () {
    btn.textContent = 'Deploying...';
    btn.disabled = true;
    fetch('/api/deploy', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        btn.textContent = data.ok ? 'Deployed!' : 'Failed';
        setTimeout(function () { btn.textContent = 'Deploy'; btn.disabled = false; }, 3000);
      })
      .catch(function () {
        btn.textContent = 'Failed';
        setTimeout(function () { btn.textContent = 'Deploy'; btn.disabled = false; }, 3000);
      });
  });
})();

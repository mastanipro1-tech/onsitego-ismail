(function () {
  'use strict';

  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var slabText = function (r) { return inr(r.from) + ' – ' + inr(r.to); };
  var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); };
  var termText = function (y) { return y === 1 ? '1 Year' : y + ' Years'; };
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var CAT_ICONS = {
    'Mobile': 'smartphone', 'Tablet': 'tablet', 'Desktop': 'monitor', 'Laptop': 'laptop', 'Printer': 'printer',
    'Streaming Media': 'cast', 'Smartwatch & Fitness Tracker': 'watch', 'Gaming Consoles': 'gamepad-2',
    'Television': 'tv', 'Home Entertainment / Speaker': 'speaker',
    'Air Conditioner': 'air-vent', 'Air Cooler': 'fan', 'Air Purifier': 'wind', 'Dishwasher': 'utensils',
    'Dryer': 'shirt', 'Microwave': 'microwave', 'Refrigerator': 'refrigerator', 'Washing Machine': 'washing-machine',
    'Chimney': 'flame', 'Coffee Machine': 'coffee', 'Deep Freezer': 'snowflake', 'Personal Care': 'scissors',
    'Robotic Vacuum Cleaner': 'bot', 'Small Home Appliance': 'plug', 'Vacuum Cleaner': 'vacuum-cleaner',
    'Visi Cooler': 'cup-soda', 'Water Dispenser': 'glass-water', 'Wine Cooler': 'wine'
  };
  var icon = function (key) { return ICONS[key] || ICONS['shield']; };
  var catIcon = function (name) { return icon(CAT_ICONS[name] || 'plug'); };
  var planIcon = function (plan) {
    if (plan.indexOf('Spills') >= 0) return icon('droplets');
    if (plan.indexOf('Screen') >= 0) return icon('shield');
    if (plan.indexOf('Total Care') >= 0) return icon('heart-handshake');
    if (plan.indexOf('4 & 5') >= 0) return icon('calendar-check');
    return icon('shield-check');
  };

  var MISPRINT_NOTES = {
    'Mobile — Screen Protection': 'The booklet misprints two slab ends here (1,60,001 and 1,80,001). Shown corrected to 1,60,000 and 1,80,000 so the slabs stay continuous.',
    'Laptop — Extended Warranty': 'The booklet misprints one slab start as 1,000. Shown corrected to 1,00,001.',
    'Television — Spills & Drops': 'The booklet misprints the last slab start as 70,00,001. Shown corrected to 7,00,001.',
    'Small Home Appliance — Extended Warranty': 'The booklet misprints one slab start as 5,000. Shown corrected to 50,001.'
  };

  /* Terms copied exactly from the booklet, keyed by plan type. */
  var TERMS_EW = [
    'VS+ Extended Warranty starts the day the Brand Warranty expires. At times, especially during festive periods, brands may offer additional warranty periods on certain devices.',
    'In case the Television brand offers 1 year Standard Warranty extension, then VS+ Extended Warranty will start at the end of the additional warranty period provided by the brand.',
    'In case the Television brand offers additional warranty only on certain components like Panel, but does not provide additional extended warranty, then VS+ Extended Warranty will start at the end of the Standard Warranty period.'
  ];
  var TERMS_MOBILE_TC = {
    intro: 'A Copay amount, of ₹599 or 5% of Purchase Price (whichever is higher), is applicable at the time of raising a Service Request.',
    bullets: [
      'The Copay will be payable before the commencement of repairs. During the repair process, Onsitego will determine whether the source of damage / malfunction / breakdown is manufacturing defect or physical / liquid damage.',
      'Copay will be refunded if the repair is done because of manufacturer\u2019s defect. Issues arising because of malfunctions, breakdowns and manufacturing of the device come under manufacturer\u2019s defects.',
      'Copay will NOT be refunded if the repair incident(s) is/are arising because of physical and / or liquid damage.'
    ]
  };
  var TERMS_LAPTOP_TC = {
    intro: 'Copay applies per repair incident, based on the laptop price band below.',
    bands: DATA.laptopCopay,
    bullets: [
      'Copay will be payable for raising each repair incident(s) and will need to be paid before the commencement of repairs.',
      'During the repair process, Onsitego will determine whether the source of damage / malfunction / breakdown was manufacturing defect or physical / liquid damage.',
      'Copay will be refunded if the repair is done because of manufacturer\u2019s defects. Issues arising because of malfunctions, breakdowns and manufacturing of the device come under manufacturer\u2019s defects.',
      'Copay will NOT be refunded if the repair incident(s) is / are arising because of physical and / or liquid damage.'
    ]
  };

  var state = { price: '', van: '' };

  function parsePrice(raw) {
    var digits = String(raw).replace(/[^0-9]/g, '');
    if (!digits) return null;
    var n = parseInt(digits, 10);
    return n > 0 ? n : null;
  }

  function tablesOf(catName) {
    return DATA.tables.filter(function (t) { return t.category === catName; });
  }

  function copyBtn(van) {
    if (!van) return '';
    return '<button type="button" class="copybtn" data-copy="' + van + '">Copy</button>';
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  });

  /* ---------- splash ---------- */
  (function splash() {
    var el = document.getElementById('splash');
    var seen = false;
    try { seen = sessionStorage.getItem('ec-splash') === '1'; } catch (e) {}
    if (seen || /[?&]nosplash/.test(location.href)) return;
    el.hidden = false;
    var finished = false;
    var finish = function () {
      if (finished) return; finished = true;
      el.classList.add('closing');
      try { sessionStorage.setItem('ec-splash', '1'); } catch (e) {}
      setTimeout(function () { el.hidden = true; }, 450);
    };
    document.getElementById('splash-skip').addEventListener('click', finish);
    setTimeout(finish, 2800);
  })();

  /* ---------- step 1: home ---------- */

  function renderVanResults() {
    var q = state.van.trim();
    if (!q) return '';
    if (!/^\d{3,6}$/.test(q)) {
      return '<div class="warn"><b>Keep typing the VAN</b>Enter 3 to 6 digits of an old or new VAN code.</div>';
    }
    var hits = [];
    DATA.tables.forEach(function (t) {
      t.rows.forEach(function (r) {
        r.plans.forEach(function (p) {
          if (p.van_new && p.van_new.indexOf(q) === 0) hits.push({ t: t, r: r, p: p, kind: 'new', van: p.van_new });
          else if (p.van_old && p.van_old.indexOf(q) === 0) hits.push({ t: t, r: r, p: p, kind: 'old', van: p.van_old });
        });
      });
    });
    if (!hits.length) return '<div class="warn"><b>No match</b>No plan carries a VAN code starting with ' + esc(q) + '.</div>';
    return hits.slice(0, 40).map(function (h) {
      return '<div class="van-hit">' +
        '<div class="van-hit-top"><span class="van-code">' + h.van + '</span>' +
        '<span class="van-kind">' + (h.kind === 'new' ? 'New VAN' : 'Old VAN') + '</span>' + copyBtn(h.van) + '</div>' +
        '<div class="van-detail">' + esc(h.t.category) + ' · ' + esc(h.t.plan) + ' · ' + termText(h.p.years) + ' · ' + inr(h.p.price) + '</div>' +
        '<div class="van-detail dim">Device price ' + slabText(h.r) + ' · <a href="#/c/' + slug(h.t.category) + '/' + DATA.tables.indexOf(h.t) + '">' + esc(h.t.plan) + ' table</a></div>' +
        '</div>';
    }).join('');
  }

  function catRange(catName) {
    var ts = tablesOf(catName);
    var min = Math.min.apply(null, ts.map(function (t) { return t.rows[0].from; }));
    var max = Math.max.apply(null, ts.map(function (t) { return t.rows[t.rows.length - 1].to; }));
    return { min: min, max: max, count: ts.length };
  }

  function renderHome() {
    var groups = [];
    var seen = {};
    DATA.categories.forEach(function (c) {
      if (!seen[c.group]) { seen[c.group] = []; groups.push({ group: c.group, cats: seen[c.group] }); }
      seen[c.group].push(c);
    });
    var html = '<section class="hero">' +
      '<div class="vansearch"><div class="field"><label for="f-van">Have a VAN code? Search it directly</label>' +
      '<input id="f-van" inputmode="numeric" autocomplete="off" value="' + esc(state.van) + '" placeholder="e.g. 232744"></div>' +
      '<div id="van-results">' + renderVanResults() + '</div></div></section>';
    html += '<h2 class="step-title"><span class="step-num">1</span> Pick a category</h2>';
    groups.forEach(function (g) {
      html += '<h3 class="group-title">' + esc(g.group) + '</h3><div class="grid">';
      g.cats.forEach(function (c) {
        var rg = catRange(c.name);
        html += '<a class="card" href="#/c/' + slug(c.name) + '">' +
          '<span class="card-icon">' + catIcon(c.name) + '</span>' +
          '<span class="card-name">' + esc(c.name) + '</span>' +
          '<span class="card-range">' + rg.count + ' plan ' + (rg.count === 1 ? 'type' : 'types') + ' · devices ' + inr(rg.min) + ' – ' + inr(rg.max) + '</span>' +
          '<span class="card-go">Choose →</span></a>';
      });
      html += '</div>';
    });
    return html;
  }

  /* ---------- step 2: plan types ---------- */

  function renderCategory(catName) {
    var cat = DATA.categories.filter(function (c) { return slug(c.name) === catName; })[0];
    if (!cat) return '<div class="panel"><h3>Not found</h3><p><a href="#/">Back to all categories</a></p></div>';
    var ts = tablesOf(cat.name);
    var rg = catRange(cat.name);
    var html = '<nav class="crumbs"><a href="#/">Categories</a> <span>›</span> ' + esc(cat.name) + '</nav>' +
      '<section class="hero slim">' +
      '<div class="hero-ic">' + catIcon(cat.name) + '</div>' +
      '<div><h2>' + esc(cat.name) + '</h2>' +
      '<p>' + esc(cat.group) + ' · ' + ts.length + ' plan ' + (ts.length === 1 ? 'type' : 'types') + ' · devices ' + inr(rg.min) + ' – ' + inr(rg.max) + '</p></div></section>' +
      '<h2 class="step-title"><span class="step-num">2</span> Pick a plan type</h2><div class="grid plans">';
    ts.forEach(function (t) {
      var idx = DATA.tables.indexOf(t);
      var prices = [];
      var years = [];
      t.rows.forEach(function (r) { r.plans.forEach(function (p) { prices.push(p.price); if (years.indexOf(p.years) < 0) years.push(p.years); }); });
      years.sort(function (a, b) { return a - b; });
      var pmin = Math.min.apply(null, prices), pmax = Math.max.apply(null, prices);
      html += '<a class="card plan-card" href="#/c/' + catName + '/' + idx + '">' +
        '<span class="card-icon">' + planIcon(t.plan) + '</span>' +
        '<span class="card-name">' + esc(t.plan) + '</span>' +
        '<span class="card-range">' + years.map(termText).join(' · ') + '</span>' +
        '<span class="card-price">' + inr(pmin) + ' – ' + inr(pmax) + '</span>' +
        '<span class="card-go">See price table →</span></a>';
    });
    html += '</div><a class="backlink" href="#/">← All categories</a>';
    return html;
  }

  /* ---------- step 3: price table ---------- */

  function renderMatch(t, price) {
    var row = null;
    for (var i = 0; i < t.rows.length; i++) {
      if (price >= t.rows[i].from && price <= t.rows[i].to) { row = t.rows[i]; break; }
    }
    if (!row) return '';
    var plans = row.plans.map(function (p) {
      return '<div class="match-plan"><span class="match-term">' + termText(p.years) + '</span>' +
        '<span class="match-price">' + inr(p.price) + '</span>' +
        '<span class="match-van">VAN (New) <b>' + (p.van_new || '–') + '</b>' + copyBtn(p.van_new) + '</span>' +
        '<span class="match-van">VAN (Old) <b>' + (p.van_old || '–') + '</b>' + copyBtn(p.van_old) + '</span></div>';
    }).join('');
    return '<div class="match"><div class="match-head">' + esc(t.plan) + ' · slab ' + slabText(row) + '</div>' +
      (t.note ? '<div class="match-note">' + esc(t.note) + '</div>' : '') + plans + '</div>';
  }

  function renderTable(t, price) {
    var inSlab = function (r) { return price !== null && price >= r.from && price <= r.to; };
    var years = [];
    t.rows.forEach(function (r) { r.plans.forEach(function (p) { if (years.indexOf(p.years) < 0) years.push(p.years); }); });
    years.sort(function (a, b) { return a - b; });
    var hasModel = t.rows.some(function (r) { return r.plans.some(function (p) { return p.model; }); });
    var html = '';
    if (t.note) html += '<div class="warn"><b>Copay applies</b>' + esc(t.note) + '</div>';
    html += '<div class="only-desktop"><table class="tbl"><thead><tr>' +
      '<th>Device price slab</th><th>Term</th><th>VAN (Old)</th><th>VAN (New)</th>' + (hasModel ? '<th>Model</th>' : '') + '<th class="num">Plan price</th>' +
      '</tr></thead><tbody>';
    t.rows.forEach(function (r) {
      r.plans.forEach(function (p, pi) {
        html += '<tr class="' + (inSlab(r) ? 'hit ' : '') + (pi === 0 ? 'slab-start' : '') + '">' +
          (pi === 0 ? '<td class="slab" rowspan="' + r.plans.length + '">' + slabText(r) + '</td>' : '') +
          '<td>' + termText(p.years) + '</td>' +
          '<td class="van">' + (p.van_old || '–') + '</td>' +
          '<td class="van">' + (p.van_new || '–') + '</td>' +
          (hasModel ? '<td class="model">' + (p.model || '–') + '</td>' : '') +
          '<td class="num price">' + inr(p.price) + '</td></tr>';
      });
    });
    html += '</tbody></table></div><div class="only-mobile">';
    t.rows.forEach(function (r) {
      html += '<div class="mrow' + (inSlab(r) ? ' hit' : '') + '"><div class="mrow-slab">' + slabText(r) + '</div>';
      r.plans.forEach(function (p) {
        html += '<div class="mrow-plan"><span class="mrow-term">' + termText(p.years) + '</span>' +
          '<span class="mrow-price">' + inr(p.price) + '</span>' +
          '<span class="mrow-van">New ' + (p.van_new || '–') + ' · Old ' + (p.van_old || '–') + '</span>' +
          (p.model ? '<span class="mrow-van model">' + esc(p.model) + '</span>' : '') + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
    if (t.name === 'Laptop — Total Care') {
      html += '<div class="copay"><div class="copay-title">Copay by laptop price</div>' +
        DATA.laptopCopay.map(function (b) {
          return '<div class="copay-row"><span>' + slabText(b) + '</span><b>' + inr(b.amount) + '</b></div>';
        }).join('') + '</div>';
    }
    if (MISPRINT_NOTES[t.name]) html += '<div class="footnote">' + esc(MISPRINT_NOTES[t.name]) + '</div>';
    if (t.source === 'sheet image') html += '<div class="footnote">Slabs above ₹60,000 come from the updated Onsitego sheet with model numbers; the lower slabs are from the booklet.</div>';
    html += '<div class="footnote">' + (years.length === 1 ? 'Available for ' + termText(years[0]) + ' only.' : 'Terms available: ' + years.map(termText).join(', ') + '.') + '</div>';
    return html;
  }

  function bulletList(items) {
    return '<ul class="plain">' + items.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
  }

  function renderTerms(t) {
    var isTC = t.plan.indexOf('Total Care') >= 0;
    var isEW = t.plan.indexOf('Extended Warranty') >= 0;
    var html = '<div class="panel terms-panel"><h3>Terms from the booklet — ' + esc(t.plan) + '</h3>';
    if (isTC && t.category === 'Mobile') {
      html += '<p>' + esc(TERMS_MOBILE_TC.intro) + '</p>' + bulletList(TERMS_MOBILE_TC.bullets);
    } else if (isTC && t.category === 'Laptop') {
      html += '<p>' + esc(TERMS_LAPTOP_TC.intro) + '</p>' +
        '<div class="copay"><div class="copay-title">Copay by laptop price</div>' +
        TERMS_LAPTOP_TC.bands.map(function (b) {
          return '<div class="copay-row"><span>' + slabText(b) + '</span><b>' + inr(b.amount) + '</b></div>';
        }).join('') + '</div>' + bulletList(TERMS_LAPTOP_TC.bullets);
    } else if (isEW) {
      html += bulletList(t.category === 'Television' ? TERMS_EW : TERMS_EW.slice(0, 1));
    } else {
      html += '<p class="hint">No separate terms are printed in the booklet for this plan.</p>';
    }
    return html + '</div>';
  }

  function renderPlan(catName, idx) {
    var cat = DATA.categories.filter(function (c) { return slug(c.name) === catName; })[0];
    var t = DATA.tables[idx];
    if (!cat || !t || t.category !== cat.name) {
      return '<div class="panel"><h3>Not found</h3><p><a href="#/">Back to all categories</a></p></div>';
    }
    var p = parsePrice(state.price);
    var row = null;
    if (p !== null) {
      for (var i = 0; i < t.rows.length; i++) {
        if (p >= t.rows[i].from && p <= t.rows[i].to) { row = t.rows[i]; break; }
      }
    }
    var html = '<nav class="crumbs"><a href="#/">Categories</a> <span>›</span> <a href="#/c/' + catName + '">' + esc(cat.name) + '</a> <span>›</span> ' + esc(t.plan) + '</nav>' +
      '<section class="hero slim">' +
      '<div class="hero-ic">' + planIcon(t.plan) + '</div>' +
      '<div><h2>' + esc(t.plan) + '</h2>' +
      '<p>' + esc(cat.name) + ' · ' + t.rows.length + ' price slabs</p></div></section>' +
      '<h2 class="step-title"><span class="step-num">3</span> Enter the device price</h2>' +
      '<div class="panel finder-panel"><div class="field"><label for="f-price">Device price (₹)</label>' +
      '<input id="f-price" inputmode="numeric" autocomplete="off" value="' + esc(state.price) + '" placeholder="e.g. 45999"></div>';
    if (p === null) {
      html += '<p class="hint">The matching slab, exact plan price and VAN codes appear here. Full table below.</p>';
    } else if (!row) {
      html += '<div class="warn"><b>Outside the covered range</b>No slab covers ' + inr(p) + ' in this plan. Covered range: ' + slabText(t.rows[0]) + ' up to ' + inr(t.rows[t.rows.length - 1].to) + '.</div>';
    } else {
      html += renderMatch(t, p);
    }
    html += '</div><div class="group-block"><h2 class="section-title">Full price table</h2>' + renderTable(t, p) + '</div>' +
      renderTerms(t) +
      '<a class="backlink" href="#/c/' + catName + '">← ' + esc(cat.name) + ' plan types</a>';
    return html;
  }

  /* ---------- reference ---------- */

  function renderReference() {
    var html = '<section class="hero"><div class="fact">From the booklet</div><h2>Reference</h2>' +
      '<p>Copay rules, warranty terms by category and the VS+ notes from the booklet.</p></section>';
    html += '<div class="panel"><h3>Mobile Total Care — Copay terms</h3>' +
      '<p>' + esc(TERMS_MOBILE_TC.intro) + '</p>' + bulletList(TERMS_MOBILE_TC.bullets) + '</div>';
    html += '<div class="panel"><h3>Laptop Total Care — Copay terms</h3>' +
      '<p>' + esc(TERMS_LAPTOP_TC.intro) + '</p>' +
      '<div class="copay"><div class="copay-title">Copay by laptop price</div>' +
      TERMS_LAPTOP_TC.bands.map(function (b) {
        return '<div class="copay-row"><span>' + slabText(b) + '</span><b>' + inr(b.amount) + '</b></div>';
      }).join('') + '</div>' + bulletList(TERMS_LAPTOP_TC.bullets) + '</div>';
    html += '<div class="panel"><h3>Term of Extended Warranty</h3>' +
      '<div class="only-desktop"><table class="tbl"><thead><tr><th>Category</th><th>Protection life span</th><th>1 Year</th><th>2 Years</th><th>3 Years</th><th>4 Years</th></tr></thead><tbody>' +
      DATA.termOfEw.map(function (t) {
        return '<tr><td>' + esc(t.category) + '</td><td>' + esc(t.lifespan) + '</td>' +
          [1, 2, 3, 4].map(function (y) { return '<td class="check">' + (t.years.indexOf(y) >= 0 ? '✓' : '✗') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><div class="only-mobile">' +
      DATA.termOfEw.map(function (t) {
        return '<div class="mrow"><div class="mrow-slab">' + esc(t.category) + '</div>' +
          '<div class="mrow-plan"><span>Life span ' + esc(t.lifespan) + '</span><span>EW terms: ' + t.years.map(termText).join(', ') + '</span></div></div>';
      }).join('') + '</div></div>';
    html += '<div class="panel"><h3>Extended Warranty — How VS+ starts</h3>' + bulletList(TERMS_EW) + '<p class="hint" style="margin-top:10px">The last two points are printed in the booklet\'s Television section.</p></div>';
    return html;
  }

  /* ---------- router ---------- */

  function render() {
    var hash = location.hash || '#/';
    var app = document.getElementById('app');
    var navHome = document.querySelector('[data-nav="home"]');
    var navRef = document.querySelector('[data-nav="reference"]');
    navHome.classList.remove('active'); navRef.classList.remove('active');
    var m = hash.match(/^#\/c\/([a-z0-9-]+)(?:\/(\d+))?$/);
    if (m && m[2] !== undefined) {
      app.innerHTML = renderPlan(m[1], parseInt(m[2], 10));
      navHome.classList.add('active');
    } else if (m) {
      app.innerHTML = renderCategory(m[1]);
      navHome.classList.add('active');
    } else if (hash === '#/reference') {
      app.innerHTML = renderReference();
      navRef.classList.add('active');
    } else {
      app.innerHTML = renderHome();
      navHome.classList.add('active');
    }
    bindInput('f-price', 'price');
    bindInput('f-van', 'van');
  }

  function bindInput(id, key) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      state[key] = el.value;
      var keep = el.value, pos = el.selectionStart;
      render();
      var nf = document.getElementById(id);
      if (nf) { nf.focus(); nf.value = keep; try { nf.setSelectionRange(pos, pos); } catch (e) {} }
    });
  }

  window.addEventListener('hashchange', render);
  render();
})();

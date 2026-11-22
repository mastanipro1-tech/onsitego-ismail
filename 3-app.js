(function () {
  'use strict';

  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var slabText = function (r) { return inr(r.from) + ' – ' + inr(r.to); };
  var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); };
  var termText = function (y) { return y === 1 ? '1 Year' : y + ' Years'; };
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var MISPRINT_NOTES = {
    'Mobile — Screen Protection': 'The booklet misprints two slab ends here (1,60,001 and 1,80,001). Shown corrected to 1,60,000 and 1,80,000 so the slabs stay continuous.',
    'Laptop — Extended Warranty': 'The booklet misprints one slab start as 1,000. Shown corrected to 1,00,001.',
    'Television — Spills & Drops': 'The booklet misprints the last slab start as 70,00,001. Shown corrected to 7,00,001.',
    'Small Home Appliance — Extended Warranty': 'The booklet misprints one slab start as 5,000. Shown corrected to 50,001.'
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

  /* ---------- renderers ---------- */

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
        '<div class="van-detail dim">Device price ' + slabText(h.r) + ' · <a href="#/c/' + slug(h.t.category) + '">Open ' + esc(h.t.category) + '</a></div>' +
        '</div>';
    }).join('');
  }

  function renderHome() {
    var groups = [];
    var seen = {};
    DATA.categories.forEach(function (c) {
      if (!seen[c.group]) { seen[c.group] = []; groups.push({ group: c.group, cats: seen[c.group] }); }
      seen[c.group].push(c);
    });
    var p = parsePrice(state.price);
    var finderNote = '';
    if (state.price.trim() && !p) {
      finderNote = '<div class="warn"><b>Price not recognised</b>Enter digits only, such as 45999. Then open a category below and the matching slab is highlighted.</div>';
    } else if (p !== null) {
      finderNote = '<p class="hint">Price set to ' + inr(p) + '. Open any category below and its matching slab and plans are shown at the top.</p>';
    }
    var html = '<section class="hero">' +
      '<div class="fact">35 plan tables · 28 categories</div>' +
      '<h2>Every VS+ plan, in one place</h2>' +
      '<p>All VS+ Onsitego protection plans from the current booklet. Browse by category, or enter a device price to see the exact slab, plan prices and VAN codes.</p>' +
      '<div class="cover"><img src="cover.png" alt="Home appliances and devices covered by VS+ plans"></div>' +
      '<div class="finder">' +
      '<div class="field"><label for="f-price">Device price (₹)</label><input id="f-price" inputmode="numeric" autocomplete="off" value="' + esc(state.price) + '" placeholder="e.g. 45999"></div>' +
      '<div class="field"><label for="f-van">VAN code search</label><input id="f-van" inputmode="numeric" autocomplete="off" value="' + esc(state.van) + '" placeholder="e.g. 232744"></div>' +
      '</div>' + finderNote + '<div id="van-results">' + renderVanResults() + '</div></section>';
    groups.forEach(function (g) {
      html += '<h2 class="section-title">' + esc(g.group) + '</h2><div class="grid">';
      g.cats.forEach(function (c) {
        var ts = tablesOf(c.name);
        var min = Math.min.apply(null, ts.map(function (t) { return t.rows[0].from; }));
        var max = Math.max.apply(null, ts.map(function (t) { return t.rows[t.rows.length - 1].to; }));
        var plans = ts.map(function (t) { return t.plan; }).join(' · ');
        html += '<a class="card" href="#/c/' + slug(c.name) + '">' +
          '<span class="card-name">' + esc(c.name) + '</span>' +
          '<span class="card-plans">' + esc(plans) + '</span>' +
          '<span class="card-range">Devices ' + inr(min) + ' – ' + inr(max) + '</span></a>';
      });
      html += '</div>';
    });
    return html;
  }

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
    var html = '';
    if (t.note) html += '<div class="warn"><b>Copay applies</b>' + esc(t.note) + '</div>';
    html += '<div class="only-desktop"><table class="tbl"><thead><tr>' +
      '<th>Device price slab</th><th>Term</th><th>VAN (Old)</th><th>VAN (New)</th><th class="num">Plan price</th>' +
      '</tr></thead><tbody>';
    t.rows.forEach(function (r) {
      r.plans.forEach(function (p, pi) {
        html += '<tr class="' + (inSlab(r) ? 'hit ' : '') + (pi === 0 ? 'slab-start' : '') + '">' +
          (pi === 0 ? '<td class="slab" rowspan="' + r.plans.length + '">' + slabText(r) + '</td>' : '') +
          '<td>' + termText(p.years) + '</td>' +
          '<td class="van">' + (p.van_old || '–') + '</td>' +
          '<td class="van">' + (p.van_new || '–') + '</td>' +
          '<td class="num price">' + inr(p.price) + '</td></tr>';
      });
    });
    html += '</tbody></table></div><div class="only-mobile">';
    t.rows.forEach(function (r) {
      html += '<div class="mrow' + (inSlab(r) ? ' hit' : '') + '"><div class="mrow-slab">' + slabText(r) + '</div>';
      r.plans.forEach(function (p) {
        html += '<div class="mrow-plan"><span class="mrow-term">' + termText(p.years) + '</span>' +
          '<span class="mrow-price">' + inr(p.price) + '</span>' +
          '<span class="mrow-van">New ' + (p.van_new || '–') + ' · Old ' + (p.van_old || '–') + '</span></div>';
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
    html += '<div class="footnote">' + (years.length === 1 ? 'Available for ' + termText(years[0]) + ' only.' : 'Terms available: ' + years.map(termText).join(', ') + '.') + '</div>';
    return html;
  }

  function renderCategory(catName) {
    var cat = DATA.categories.filter(function (c) { return slug(c.name) === catName; })[0];
    if (!cat) return '<div class="panel"><h3>Not found</h3><p><a href="#/">Back to all categories</a></p></div>';
    var ts = tablesOf(cat.name);
    var p = parsePrice(state.price);
    var min = Math.min.apply(null, ts.map(function (t) { return t.rows[0].from; }));
    var max = Math.max.apply(null, ts.map(function (t) { return t.rows[t.rows.length - 1].to; }));
    var anyMatch = p !== null && ts.some(function (t) { return t.rows.some(function (r) { return p >= r.from && p <= r.to; }); });
    var html = '<section class="hero">' +
      '<div class="fact">' + esc(cat.group) + '</div>' +
      '<h2>' + esc(cat.name) + '</h2>' +
      '<p>' + ts.length + ' plan ' + (ts.length === 1 ? 'table' : 'tables') + ' · devices ' + inr(min) + ' – ' + inr(max) + '</p>' +
      '<div class="finder"><div class="field"><label for="f-price">Device price (₹)</label>' +
      '<input id="f-price" inputmode="numeric" autocomplete="off" value="' + esc(state.price) + '" placeholder="e.g. 45999"></div></div>';
    if (p !== null && !anyMatch) {
      html += '<div class="warn"><b>Outside the covered range</b>No slab in ' + esc(cat.name) + ' covers ' + inr(p) + '. This category covers devices from ' + inr(min) + ' to ' + inr(max) + '.</div>';
    } else if (p === null) {
      html += '<p class="hint">Enter the device price to pin the matching slab and its VAN codes here, or scroll the full tables below.</p>';
    }
    if (p !== null && anyMatch) ts.forEach(function (t) { html += renderMatch(t, p); });
    html += '</section>';
    ts.forEach(function (t) {
      html += '<div class="group-block"><h2 class="section-title">' + esc(t.plan) + '</h2>' + renderTable(t, p) + '</div>';
    });
    html += '<a class="backlink" href="#/">← All categories</a>';
    return html;
  }

  function renderReference() {
    var html = '<section class="hero"><div class="fact">From the booklet</div><h2>Reference</h2>' +
      '<p>Copay rules, warranty terms by category and the VS+ notes from the booklet.</p></section>';
    html += '<div class="panel"><h3>Copay</h3>' +
      '<p>' + esc(DATA.mobileCopay) + '</p>' +
      '<p>Laptop Total Care copay: ₹999 up to ₹40,000 · ₹1,999 up to ₹1,00,000 · ₹3,999 up to ₹2,00,000 · ₹6,999 up to ₹3,00,000.</p>' +
      '<ul class="plain">' + DATA.copayNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
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
    html += '<div class="panel"><h3>How VS+ Extended Warranty starts</h3><ul class="plain">' +
      DATA.vsNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    return html;
  }

  function render() {
    var hash = location.hash || '#/';
    var app = document.getElementById('app');
    var navHome = document.querySelector('[data-nav="home"]');
    var navRef = document.querySelector('[data-nav="reference"]');
    navHome.classList.remove('active'); navRef.classList.remove('active');
    if (hash.indexOf('#/c/') === 0) {
      app.innerHTML = renderCategory(hash.slice(4));
      navHome.classList.add('active');
    } else if (hash === '#/reference') {
      app.innerHTML = renderReference();
      navRef.classList.add('active');
    } else {
      app.innerHTML = renderHome();
      navHome.classList.add('active');
    }
    var fp = document.getElementById('f-price');
    if (fp) {
      fp.addEventListener('input', function () {
        state.price = fp.value;
        var keep = fp.value, pos = fp.selectionStart;
        render();
        var nf = document.getElementById('f-price');
        nf.focus(); nf.value = keep;
        try { nf.setSelectionRange(pos, pos); } catch (e) {}
      });
    }
    var fv = document.getElementById('f-van');
    if (fv) {
      fv.addEventListener('input', function () {
        state.van = fv.value;
        var keep = fv.value, pos = fv.selectionStart;
        render();
        var nf = document.getElementById('f-van');
        if (nf) { nf.focus(); nf.value = keep; try { nf.setSelectionRange(pos, pos); } catch (e) {} }
      });
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();

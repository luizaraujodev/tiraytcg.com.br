(function () {
  'use strict';

  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRECvefEMmu1PTmPoth07T1pOqqsYUEfKdtkuFWD2Ppc99t2a6ZafWitPntN1ai4aq4I7PeAmkKSkQY/pub?gid=676028177&single=true&output=csv';
  var WHATS = '5537999356759';
  var PAGE = 48;
  var STORE = 'tiray-pedido-v1';

  var $ = function (id) { return document.getElementById(id); };
  var MAX_URL_TEXT = 1500, listaCompleta = '';
  var cards = [], filtered = [], shown = 0, cart = {};

  // ---------- CSV ----------
  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = ''; rows.push(row); row = [];
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function num(v) {
    var n = parseFloat(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
  function brl(n) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  var FLAG = { PT: 'br', EN: 'us', JP: 'jp', ES: 'es' };
  var LANG_ORDER = { PT: 0, EN: 1, JP: 2, ES: 3 };
  function flag(l) {
    var f = FLAG[l];
    return f ? '<img class="ms-flag" src="https://flagcdn.com/w40/' + f + '.png" width="20" height="15" alt="" aria-hidden="true"> ' : '';
  }
  var collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
  function cmp(a, b) {
    return collator.compare(a.id, b.id) ||
      ((LANG_ORDER[a.idioma] == null ? 9 : LANG_ORDER[a.idioma]) - (LANG_ORDER[b.idioma] == null ? 9 : LANG_ORDER[b.idioma])) ||
      collator.compare(a.variacao, b.variacao) || collator.compare(a.condicao, b.condicao);
  }

  function load() {
    fetch(CSV_URL).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      var rows = parseCSV(t), head = rows.shift().map(function (h) { return norm(h).trim(); });
      cards = rows.map(function (r) {
        var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
        o.preco = num(o.preco); o.qtd = Math.floor(num(o.qtd));
        o.idioma = o.idioma.toUpperCase();
        if (norm(o.variacao) === 'reverse') o.variacao = 'Reverse Holo';
        if (norm(o.variacao) === 'normal') o.variacao = '';
        o.titulo = o.nome + (o.variacao ? ' (' + o.variacao + ')' : '');
        o.link = /^https?:\/\//i.test(o.link_compra || '') ? o.link_compra : '';
        o.key = [o.id, o.idioma, o.variacao, o.condicao].join('|');
        o.busca = norm([o.titulo, o.numero, o.id, o.set].join(' '));
        return o;
      }).filter(function (o) { return o.id && o.nome && o.nome !== 'NÃO ENCONTRADO' && ((o.qtd > 0 && o.preco > 0) || o.link); });
      cards.sort(cmp);
      fillFilters(); apply();
    }).catch(function () {
      $('count').textContent = 'Não foi possível carregar o catálogo agora. Tente novamente em instantes.';
    });
  }

  // ---------- filtros ----------
  var FILTERS = { 'f-set': 'set', 'f-idioma': 'idioma', 'f-raridade': 'raridade', 'f-variacao': 'variacao', 'f-condicao': 'condicao' };
  function fillFilters() {
    Object.keys(FILTERS).forEach(function (id) {
      var k = FILTERS[id], vals = {};
      cards.forEach(function (c) { if (c[k]) vals[c[k]] = 1; });
      Object.keys(vals).sort().forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; $(id).appendChild(o);
      });
    });
  }
  function hasFilters() {
    for (var id in FILTERS) if ($(id).value) return true;
    return $('sort').value !== 'id';
  }
  function apply() {
    var q = norm($('q').value).trim();
    filtered = cards.filter(function (c) {
      if (q && c.busca.indexOf(q) < 0) return false;
      for (var id in FILTERS) { var v = $(id).value; if (v && c[FILTERS[id]] !== v) return false; }
      return true;
    });
    var so = $('sort').value;
    if (so !== 'id') filtered.sort(function (a, b) {
      return so === 'nome' ? collator.compare(a.titulo, b.titulo) :
        so === 'preco-asc' ? (a.preco || 1e9) - (b.preco || 1e9) : b.preco - a.preco;
    });
    $('reset').hidden = !q && !hasFilters();
    shown = 0; $('grid').innerHTML = ''; more();
    $('count').textContent = filtered.length + (filtered.length === 1 ? ' carta' : ' cartas') + ' disponíveis';
  }

  // ---------- grid ----------
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'loja'; } }
  function thumb(u) { return u ? u.replace('/high.webp', '/low.webp') : ''; }
  function more() {
    var html = filtered.slice(shown, shown + PAGE).map(function (c) {
      var i = cards.indexOf(c);
      return '<article class="ms-card">' +
        '<div class="ms-img">' + (c.imagem ? '<img loading="lazy" src="' + esc(thumb(c.imagem)) + '" alt="' + esc(c.titulo) + '" onerror="this.remove()">' : '') + '<span class="ms-ph">' + esc(c.nome) + '</span></div>' +
        '<h3>' + esc(c.titulo) + '</h3>' +
        '<p class="ms-meta">' + esc(c.set) + ' · ' + esc(c.numero) + '</p>' +
        '<p class="ms-tags"><span>' + flag(c.idioma) + esc(c.idioma) + '</span><span>' + esc(c.condicao) + '</span>' + (c.raridade ? '<span>' + esc(c.raridade) + '</span>' : '') + '</p>' +
        (c.preco ? '<p class="ms-price">' + brl(c.preco) + (c.qtd > 0 ? ' <small>' + c.qtd + ' em estoque</small>' : '') + '</p>' : '') +
        (c.link ? '<a class="ms-buy" href="' + esc(c.link) + '" target="_blank" rel="noopener">Comprar em ' + esc(host(c.link)) + '</a>' : '') +
        (!c.link && c.qtd > 0 && c.preco > 0 ? '<button class="ms-add" data-i="' + i + '">Adicionar</button>' : '') + '</article>';
    }).join('');
    $('grid').insertAdjacentHTML('beforeend', html);
    shown += PAGE; $('more').hidden = shown >= filtered.length;
  }

  // ---------- carrinho ----------
  function save() { try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) {} }
  function restore() { try { cart = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { cart = {}; } }
  function byKey(k) { for (var i = 0; i < cards.length; i++) if (cards[i].key === k) return cards[i]; }

  function lines() {
    var out = [];
    Object.keys(cart).forEach(function (k) {
      var c = byKey(k);
      if (c) out.push({ c: c, n: Math.min(cart[k], c.qtd) });
    });
    return out;
  }

  function renderCart() {
    var ls = lines(), total = 0, items = 0;
    ls.forEach(function (l) { total += l.n * l.c.preco; items += l.n; });
    $('bar').hidden = !items;
    $('bar-text').textContent = items + (items === 1 ? ' carta · ' : ' cartas · ') + brl(total);
    $('cart-list').innerHTML = ls.map(function (l) {
      return '<li><div><b>' + esc(l.c.titulo) + '</b><small>' + esc(l.c.numero) + ' · ' + flag(l.c.idioma) + esc(l.c.idioma) + ' · ' + esc(l.c.condicao) + '</small></div>' +
        '<div class="ms-qty"><button data-k="' + esc(l.c.key) + '" data-d="-1" aria-label="Menos">−</button><span>' + l.n + '</span><button data-k="' + esc(l.c.key) + '" data-d="1" aria-label="Mais">+</button></div>' +
        '<span class="ms-line">' + brl(l.n * l.c.preco) + '</span></li>';
    }).join('');
    $('cart-total').textContent = 'Total: ' + brl(total);
    var VC = { 'Holo': 'H', 'Reverse Holo': 'RH' };
    var lista = ls.map(function (l) {
      return l.n + 'x ' + l.c.id.toUpperCase() + ' (' + [l.c.idioma, l.c.condicao, VC[l.c.variacao]].filter(Boolean).join(' ') + ')';
    }).join('\n');
    var cab = 'Olá! Quero fazer um pedido do catálogo de cartas:\n';
    var msg = cab + lista + '\nTotal: ' + brl(total);
    var longo = encodeURIComponent(msg).length > MAX_URL_TEXT;
    if (longo) msg = 'Olá! Quero fazer um pedido do catálogo de cartas: ' + items + ' cartas, total ' + brl(total) + '. Vou colar a lista completa a seguir.';
    listaCompleta = lista + '\nTotal: ' + brl(total);
    $('copy-wrap').hidden = !longo;
    $('send').href = 'https://wa.me/' + WHATS + '?text=' + encodeURIComponent(msg);
    if (!items) $('sheet').hidden = true;
  }

  function change(k, d) {
    var c = byKey(k); if (!c) return;
    var n = Math.max(0, Math.min(c.qtd, (cart[k] || 0) + d));
    if (n) cart[k] = n; else delete cart[k];
    save(); renderCart();
  }

  // ---------- eventos ----------
  var t; $('q').addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 150); });
  Object.keys(FILTERS).forEach(function (id) { $(id).addEventListener('change', apply); });
  $('sort').addEventListener('change', apply);
  $('reset').addEventListener('click', function () {
    $('q').value = ''; $('sort').value = 'id';
    Object.keys(FILTERS).forEach(function (id) { $(id).value = ''; });
    apply();
  });
  $('more').addEventListener('click', more);
  $('grid').addEventListener('click', function (e) {
    var b = e.target.closest('.ms-add'); if (!b) return;
    change(cards[b.dataset.i].key, 1);
    var t0 = b.textContent; b.textContent = 'Adicionado ✓'; setTimeout(function () { b.textContent = t0; }, 900);
  });
  $('cart-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]'); if (b) change(b.dataset.k, +b.dataset.d);
  });
  $('open-cart').addEventListener('click', function () { $('sheet').hidden = false; });
  $('sheet').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) $('sheet').hidden = true; });
  $('copy').addEventListener('click', function () {
    var b = $('copy');
    function ok() { b.textContent = 'Lista copiada ✓'; setTimeout(function () { b.textContent = 'Copiar lista do pedido'; }, 1800); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = listaCompleta; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) {} ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(listaCompleta).then(ok, fallback); else fallback();
  });
  $('clear').addEventListener('click', function () { cart = {}; save(); renderCart(); });

  restore(); load();
  // renderCart depende dos dados; roda após carregar
  var wait = setInterval(function () { if (cards.length) { clearInterval(wait); renderCart(); } }, 100);
})();

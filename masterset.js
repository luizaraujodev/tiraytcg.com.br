(function () {
  'use strict';

  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRECvefEMmu1PTmPoth07T1pOqqsYUEfKdtkuFWD2Ppc99t2a6ZafWitPntN1ai4aq4I7PeAmkKSkQY/pub?gid=676028177&single=true&output=csv';
  var WHATS = '5537999356759';
  var PAGE = 48;
  var STORE = 'tiray-pedido-v1';

  var $ = function (id) { return document.getElementById(id); };
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
        o.key = [o.id, o.idioma, o.variacao, o.condicao].join('|');
        o.busca = norm([o.titulo, o.numero, o.id, o.set].join(' '));
        return o;
      }).filter(function (o) { return o.id && o.nome && o.nome !== 'NÃO ENCONTRADO' && o.qtd > 0 && o.preco > 0; });
      fillFilters(); apply();
    }).catch(function () {
      $('count').textContent = 'Não foi possível carregar o catálogo agora. Tente novamente em instantes.';
    });
  }

  // ---------- filtros ----------
  var FILTERS = { 'f-set': 'set', 'f-idioma': 'idioma', 'f-raridade': 'raridade', 'f-variacao': 'variacao' };
  function fillFilters() {
    Object.keys(FILTERS).forEach(function (id) {
      var k = FILTERS[id], vals = {};
      cards.forEach(function (c) { if (c[k]) vals[c[k]] = 1; });
      Object.keys(vals).sort().forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; $(id).appendChild(o);
      });
    });
  }
  function apply() {
    var q = norm($('q').value).trim();
    filtered = cards.filter(function (c) {
      if (q && c.busca.indexOf(q) < 0) return false;
      for (var id in FILTERS) { var v = $(id).value; if (v && c[FILTERS[id]] !== v) return false; }
      return true;
    });
    shown = 0; $('grid').innerHTML = ''; more();
    $('count').textContent = filtered.length + (filtered.length === 1 ? ' carta' : ' cartas') + ' disponíveis';
  }

  // ---------- grid ----------
  function thumb(u) { return u ? u.replace('/high.webp', '/low.webp') : ''; }
  function more() {
    var html = filtered.slice(shown, shown + PAGE).map(function (c) {
      var i = cards.indexOf(c);
      return '<article class="ms-card">' +
        '<div class="ms-img">' + (c.imagem ? '<img loading="lazy" src="' + esc(thumb(c.imagem)) + '" alt="' + esc(c.titulo) + '" onerror="this.remove()">' : '') + '<span class="ms-ph">' + esc(c.nome) + '</span></div>' +
        '<h3>' + esc(c.titulo) + '</h3>' +
        '<p class="ms-meta">' + esc(c.set) + ' · ' + esc(c.numero) + '</p>' +
        '<p class="ms-tags"><span>' + esc(c.idioma) + '</span><span>' + esc(c.condicao) + '</span>' + (c.raridade ? '<span>' + esc(c.raridade) + '</span>' : '') + '</p>' +
        '<p class="ms-price">' + brl(c.preco) + ' <small>' + c.qtd + ' em estoque</small></p>' +
        '<button class="ms-add" data-i="' + i + '">Adicionar</button></article>';
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
      return '<li><div><b>' + esc(l.c.titulo) + '</b><small>' + esc(l.c.numero) + ' · ' + esc(l.c.idioma) + ' · ' + esc(l.c.condicao) + '</small></div>' +
        '<div class="ms-qty"><button data-k="' + esc(l.c.key) + '" data-d="-1" aria-label="Menos">−</button><span>' + l.n + '</span><button data-k="' + esc(l.c.key) + '" data-d="1" aria-label="Mais">+</button></div>' +
        '<span class="ms-line">' + brl(l.n * l.c.preco) + '</span></li>';
    }).join('');
    $('cart-total').textContent = 'Total: ' + brl(total);
    var msg = 'Olá! Quero fazer um pedido do catálogo Masterset:\n' + ls.map(function (l) {
      return '• ' + l.c.titulo + ' ' + l.c.numero + ' (' + [l.c.idioma, l.c.condicao].join(', ') + ') x' + l.n + ' - ' + brl(l.n * l.c.preco);
    }).join('\n') + '\nTotal: ' + brl(total);
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
  $('more').addEventListener('click', more);
  $('grid').addEventListener('click', function (e) {
    var b = e.target.closest('.ms-add'); if (!b) return;
    change(cards[b.dataset.i].key, 1);
    b.textContent = 'Adicionado ✓'; setTimeout(function () { b.textContent = 'Adicionar'; }, 900);
  });
  $('cart-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]'); if (b) change(b.dataset.k, +b.dataset.d);
  });
  $('open-cart').addEventListener('click', function () { $('sheet').hidden = false; });
  $('sheet').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) $('sheet').hidden = true; });
  $('clear').addEventListener('click', function () { cart = {}; save(); renderCart(); });

  restore(); load();
  // renderCart depende dos dados; roda após carregar
  var wait = setInterval(function () { if (cards.length) { clearInterval(wait); renderCart(); } }, 100);
})();

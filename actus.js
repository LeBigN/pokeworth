(function () {
  "use strict";
  var TYPES = { sortie: "Sortie Pokémon", app: "Mise à jour de l'app" };

  function fmt(d) {
    var x = new Date(d + "T12:00:00");
    if (isNaN(x)) return d;
    return x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }
  function isFuture(d) { return daysTo(d) > 0; }
  function daysTo(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var t = new Date(d + "T00:00:00");
    return Math.round((t - today) / 86400000);
  }
  function chip(n) {
    if (n.type !== "sortie") return null;
    var k = daysTo(n.date);
    if (k === 0) return el("span", "chip chip-now", "Aujourd'hui");
    if (k > 0) return el("span", "chip", "J-" + k);
    return null;
  }
  function visual(n, cls) {
    var box = el("div", cls);
    var img = el("img");
    img.src = n.image; img.alt = n.image_alt || ""; img.loading = "lazy"; img.decoding = "async";
    box.appendChild(img);
    return box;
  }
  function addPoints(parent, n) {
    if (!(n.points && n.points.length)) return;
    var ul = el("ul", "news-points np-inline");
    n.points.forEach(function (p) { ul.appendChild(el("li", "", p)); });
    parent.appendChild(ul);
  }
  function addProduits(parent, n) {
    if (!(n.produits && n.produits.length)) return;
    var g = el("div", "prod-grid");
    n.produits.forEach(function (p) {
      var t = el("figure", "prod" + (p.large ? " prod-wide" : ""));
      var im = el("img"); im.src = p.image; im.alt = p.alt || p.nom || ""; im.loading = "lazy"; im.decoding = "async";
      var v = el("div", "prod-img"); v.appendChild(im); t.appendChild(v);
      var c = el("figcaption");
      c.appendChild(el("strong", "", p.nom || ""));
      if (p.detail) c.appendChild(el("span", "", p.detail));
      t.appendChild(c); g.appendChild(t);
    });
    parent.appendChild(g);
  }
  function hero(n, lvl) {
    var c = el("article", "news-hero");
    c.appendChild(visual(n, "nh-visual"));
    var b = el("div", "nh-body");
    var left = el("div", "nh-text");
    left.appendChild(el("time", "news-date", fmt(n.date)));
    left.appendChild(el(lvl || "h3", "", n.titre || ""));
    b.appendChild(left);
    var ch = chip(n); if (ch) b.appendChild(ch);
    c.appendChild(b);
    if (n.texte) c.appendChild(el("p", "nh-desc", n.texte));
    addPoints(c, n);
    addProduits(c, n);
    return c;
  }
  function row(n, lvl) {
    var c = el("article", "news-row");
    c.appendChild(visual(n, "nr-thumb"));
    var t = el("div", "nr-text");
    t.appendChild(el("time", "news-date", fmt(n.date)));
    t.appendChild(el(lvl || "h3", "", n.titre || ""));
    if (n.texte) t.appendChild(el("p", "", n.texte));
    addPoints(t, n);
    c.appendChild(t);
    var ch = chip(n); if (ch) c.appendChild(ch);
    addProduits(c, n);
    return c;
  }
  function build(items, lvl) {
    var frag = document.createDocumentFragment(), first = true;
    items.forEach(function (n) {
      if (n.image) { frag.appendChild(first ? hero(n, lvl) : row(n, lvl)); first = false; }
      else frag.appendChild(card(n, lvl));
    });
    return frag;
  }
  function card(n, lvl) {
    var c = el("article", "card news");
    var meta = el("div", "news-meta");
    var future = n.type === "sortie" && isFuture(n.date);
    meta.appendChild(el("span", "tag" + (n.type === "sortie" ? " t-sortie" : " t-app"), TYPES[n.type] || "Actualité"));
    if (future) meta.appendChild(el("span", "tag t-soon", "À venir"));
    if (n.version) meta.appendChild(el("span", "tag", "Version " + n.version));
    meta.appendChild(el("time", "news-date", (future ? "Sortie le " : "") + fmt(n.date)));
    c.appendChild(meta);
    c.appendChild(el(lvl || "h3", "", n.titre || ""));
    if (n.texte) c.appendChild(el("p", "", n.texte));
    if (n.points && n.points.length) {
      var ul = el("ul", "news-points");
      n.points.forEach(function (p) { ul.appendChild(el("li", "", p)); });
      c.appendChild(ul);
    }
    if (n.lien) {
      var a = el("a", "news-link", n.lien_texte || "En savoir plus");
      a.href = n.lien; a.rel = "noopener";
      c.appendChild(a);
    }
    return c;
  }
  function sortDesc(list) {
    function up(n) { return n.type === "sortie" && daysTo(n.date) >= 0; }
    return list.slice().sort(function (a, b) {
      if (up(a) !== up(b)) return up(a) ? -1 : 1;
      if (up(a)) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
  }

  fetch("actualites.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var all = sortDesc(data.actualites || []);

      // accueil : dernières actualités
      var home = document.getElementById("home-news");
      if (home) {
        var box = home.querySelector(".news-grid");
        box.appendChild(build(all.slice(0, 3)));
        if (all.length) home.hidden = false;
      }

      // page actualités : filtres + liste
      var root = document.getElementById("news-root");
      if (root) {
        var list = document.getElementById("news-list");
        var empty = document.getElementById("news-empty");
        var btns = root.querySelectorAll("[data-filter]");
        function render(f) {
          list.textContent = "";
          var items = all.filter(function (n) { return f === "all" || n.type === f; });
          list.appendChild(build(items, "h2"));
          empty.hidden = items.length > 0;
          if (!items.length) {
            empty.textContent = f === "sortie" ? "Aucune sortie Pokémon annoncée pour le moment."
              : f === "app" ? "Aucune mise à jour à signaler pour le moment."
              : "Aucune actualité pour le moment.";
          }
        }
        btns.forEach(function (b) {
          b.addEventListener("click", function () {
            btns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            render(b.getAttribute("data-filter"));
          });
        });
        render("all");
      }
    })
    .catch(function () {
      var e = document.getElementById("news-empty");
      if (e) { e.hidden = false; e.textContent = "Les actualités sont momentanément indisponibles."; }
    });
})();

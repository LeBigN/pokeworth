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
  function isFuture(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(d + "T12:00:00") > today;
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
    return list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  fetch("actualites.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var all = sortDesc(data.actualites || []);

      // accueil : dernières actualités
      var home = document.getElementById("home-news");
      if (home) {
        var box = home.querySelector(".news-grid");
        all.slice(0, 3).forEach(function (n) { box.appendChild(card(n)); });
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
          items.forEach(function (n) { list.appendChild(card(n, "h2")); });
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

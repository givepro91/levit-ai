// Levit AI 직무과제 — 인터랙션 (의존성 없음)
(function () {
  "use strict";

  // ---- theme ----
  var root = document.documentElement;
  var saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.setAttribute("data-theme", "dark");

  function toggleTheme() {
    var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", cur);
    localStorage.setItem("theme", cur);
    var b = document.getElementById("themeBtn");
    if (b) b.textContent = cur === "dark" ? "☀︎ 라이트" : "☾ 다크";
  }
  var tb = document.getElementById("themeBtn");
  if (tb) {
    tb.addEventListener("click", toggleTheme);
    tb.textContent = root.getAttribute("data-theme") === "dark" ? "☀︎ 라이트" : "☾ 다크";
  }

  // ---- mobile menu ----
  var sidebar = document.getElementById("sidebar");
  var menuBtn = document.getElementById("menuBtn");
  var scrim = document.getElementById("scrim");
  function closeMenu() { if (sidebar) sidebar.classList.remove("open"); if (scrim) scrim.style.display = "none"; }
  if (menuBtn) menuBtn.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    if (scrim) scrim.style.display = sidebar.classList.contains("open") ? "block" : "none";
  });
  if (scrim) scrim.addEventListener("click", closeMenu);

  // ---- progress bar ----
  var prog = document.getElementById("progress");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (prog) prog.style.width = p + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- callout classes from blockquote content ----
  document.querySelectorAll(".content blockquote").forEach(function (bq) {
    var t = bq.textContent || "";
    if (t.indexOf("⚠️") !== -1) bq.classList.add("cl-warn");
    else if (t.indexOf("⭐") !== -1 || t.indexOf("핵심") === 0) bq.classList.add("cl-star");
  });

  // ---- scrollspy for TOC ----
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href"); if (id && id[0] === "#") map[id.slice(1)] = a;
  });
  var heads = Array.prototype.slice.call(document.querySelectorAll(".content h1[id], .content h2[id]"));
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (l) { l.classList.remove("active"); });
        var a = map[e.target.id];
        if (a) { a.classList.add("active"); }
      }
    });
  }, { rootMargin: "-10% 0px -78% 0px", threshold: 0 });
  heads.forEach(function (h) { spy.observe(h); });

  // close mobile menu on nav click
  links.forEach(function (a) { a.addEventListener("click", function () { if (window.innerWidth <= 980) closeMenu(); }); });

  // (cost bars use pure CSS animation from inline width; no JS needed)

  // ---- reveal on scroll (progressive enhancement; print/no-JS shows all) ----
  document.body.classList.add("js-anim");
  var revs = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rObs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revs.forEach(function (el) { rObs.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add("in"); });
  }
})();

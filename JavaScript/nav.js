/* nav.js: menú móvil, pasos del proceso y carrusel de capturas. Vanilla, sin librerías. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  raiz.classList.add('js');

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  function comportamiento() { return reducido.matches ? 'auto' : 'smooth'; }

  /* ---------- Menú ---------- */
  var toggle = document.querySelector('button.nav__toggle');
  var menu = document.getElementById('menu');

  function abrirMenu(abrir, devolverFoco) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    menu.classList.toggle('is-open', abrir);
    if (!abrir && devolverFoco) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      abrirMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) abrirMenu(false, true);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) abrirMenu(false, false);
    });
    var escritorio = window.matchMedia('(min-width: 1024px)');
    var alCambiar = function (e) { if (e.matches) abrirMenu(false, false); };
    if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiar);
    else if (escritorio.addListener) escritorio.addListener(alCambiar);
  }

  /* ---------- Pasos del proceso: .is-visto una sola vez ---------- */
  var pasos = document.querySelectorAll('.proceso__paso');
  if (pasos.length) {
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visto');
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      pasos.forEach(function (p) { obs.observe(p); });
    } else {
      pasos.forEach(function (p) { p.classList.add('is-visto'); });
    }
  }

  /* ---------- Carrusel ---------- */
  document.querySelectorAll('[data-carrusel]').forEach(function (car) {
    var pista = car.querySelector('.carrusel__pista');
    var prev = car.querySelector('[data-carrusel-prev]');
    var next = car.querySelector('[data-carrusel-next]');
    if (!pista) return;

    function anchoSlide() {
      var s = pista.querySelector('.carrusel__slide');
      if (!s) return pista.clientWidth;
      var gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
      return s.getBoundingClientRect().width + gap;
    }
    function mover(dir) {
      pista.scrollBy({ left: dir * anchoSlide(), behavior: comportamiento() });
    }
    function actualizar() {
      var max = pista.scrollWidth - pista.clientWidth;
      if (prev) prev.disabled = pista.scrollLeft <= 1;
      if (next) next.disabled = pista.scrollLeft >= max - 1;
    }
    var pendiente = false;
    pista.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; actualizar(); });
    }, { passive: true });
    window.addEventListener('resize', actualizar);

    if (prev) prev.addEventListener('click', function () { mover(-1); });
    if (next) next.addEventListener('click', function () { mover(1); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    });
    pista.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', actualizar); });
    actualizar();
  });
})();

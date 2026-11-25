/* portafolio.js: copiar mail, reveal al entrar, carrusel de proyectos en celular, nav activo. Vanilla. */
(function () {
  'use strict';

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Copiar mail ---------- */
  function copiarFallback(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, texto.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarFallback(texto); });
    }
    return Promise.resolve(copiarFallback(texto));
  }

  var estado = document.querySelector('[data-copiar-estado]');
  document.querySelectorAll('[data-copiar-mail]').forEach(function (btn) {
    var original = btn.textContent;
    var timer = null;
    btn.addEventListener('click', function () {
      copiar(btn.getAttribute('data-copiar-mail')).then(function (ok) {
        btn.textContent = ok ? 'Copiado ✓' : 'No se pudo copiar';
        if (estado) estado.textContent = ok ? 'Mail copiado al portapapeles' : 'No se pudo copiar el mail';
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.textContent = original;
          if (estado) estado.textContent = '';
        }, 2000);
      });
    });
  });

  /* ---------- Reveal ---------- */
  var elementos = document.querySelectorAll('[data-reveal]');
  if (elementos.length) {
    if (!('IntersectionObserver' in window) || reducido.matches) {
      elementos.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
      elementos.forEach(function (el) { obs.observe(el); });
    }
  }

  /* ---------- Carrusel de proyectos (celular) ---------- */
  var pista = document.querySelector('[data-proy-pista]');
  var prev = document.querySelector('[data-proy-prev]');
  var next = document.querySelector('[data-proy-next]');
  if (pista) {
    var paso = function () {
      var li = pista.querySelector('li');
      if (!li) return pista.clientWidth;
      var gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
      return li.getBoundingClientRect().width + gap;
    };
    var mover = function (dir) {
      pista.scrollBy({ left: dir * paso(), behavior: reducido.matches ? 'auto' : 'smooth' });
    };
    var actualizar = function () {
      var max = pista.scrollWidth - pista.clientWidth;
      if (prev) prev.disabled = pista.scrollLeft <= 1;
      if (next) next.disabled = pista.scrollLeft >= max - 1;
    };
    var pendiente = false;
    pista.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; actualizar(); });
    }, { passive: true });
    window.addEventListener('resize', actualizar);
    if (prev) prev.addEventListener('click', function () { mover(-1); });
    if (next) next.addEventListener('click', function () { mover(1); });
    pista.addEventListener('keydown', function (e) {
      if (e.target !== pista) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    });
    actualizar();
  }

  /* ---------- Nav activo ---------- */
  var links = document.querySelectorAll('.nav__links a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var secs = Object.keys(mapa).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var navObs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = mapa[en.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { navObs.observe(s); });
  }
})();

/* cotizador.js: cotizador de 4 pasos, sin precios. Vanilla, sin librerías.
 * Paso 1, 2 y 4: una opción, avanza solo a los 250 ms (solo con click, Enter o Espacio).
 * Paso 3: varias opciones y botón "Siguiente".
 * Sin JS quedan los cuatro pasos visibles (la clase "js" activa el flujo paso a paso).
 */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var WHATSAPP = '5491124080590';
  var MAIL = 'zentenojose123456@gmail.com';
  var TOTAL = 4;
  var NOMBRES = ['necesidad', 'rubro', 'funciones', 'plazo'];

  var RECOMENDACIONES = {
    web: {
      titulo: 'Web para tu negocio',
      texto: 'Tu web propia, que muestre lo que hacés y reciba consultas. Se ve bien en el celular y en la compu.'
    },
    catalogo: {
      titulo: 'Catálogo online',
      texto: 'Tus productos ordenados por categoría, listos para compartir por link y para que te consulten por WhatsApp.'
    },
    sistema: {
      titulo: 'Sistema de pedidos o turnos',
      texto: 'Un panel para cargar y seguir pedidos o turnos, con link de seguimiento y mails automáticos, como el de ZUNOX 3D.'
    },
    clientes: {
      titulo: 'Administración de clientes',
      texto: 'Clientes, pedidos y estados en un solo lugar, para dejar de buscar en planillas y chats.'
    },
    app: {
      titulo: 'App Android simple',
      texto: 'Una app hecha solo para tu negocio, que se instala en los celulares de tu equipo.'
    },
    otra: {
      titulo: 'Charlar tu caso',
      texto: 'Primero charlamos y entiendo qué te frena. Te propongo lo más simple que lo resuelva.'
    }
  };

  var form = document.getElementById('cotizador');
  if (!form) return;

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  function comp() { return reducido.matches ? 'auto' : 'smooth'; }

  var pasos = Array.prototype.slice.call(form.querySelectorAll('fieldset.paso'));
  var cabecera = form.querySelector('.cotizador__cabecera');
  var progreso = form.querySelector('.cotizador__progreso');
  var textoPaso = form.querySelector('[data-paso-actual]');
  var error = form.querySelector('[data-error]');
  var navForm = form.querySelector('.cotizador__nav');
  var btnAtras = form.querySelector('[data-atras]');
  var btnSig = form.querySelector('[data-siguiente]');
  var resultado = document.getElementById('resultado');
  var linkWa = form.querySelector('[data-res-whatsapp]');
  var linkMail = form.querySelector('[data-res-mail]');

  var paso = 1;
  var timerAvance = null;
  var ultimaTecla = '';

  function marcados(nombre) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + nombre + '"]:checked'));
  }
  function textoDe(inp) {
    var t = inp.closest('label').querySelector('.opcion__texto');
    return (t ? t.textContent : inp.value).trim();
  }
  function etiquetas(nombre) { return marcados(nombre).map(textoDe); }
  function valor(nombre) { var m = marcados(nombre)[0]; return m ? m.value : null; }

  function mostrarError(msg) {
    if (!error) return;
    error.textContent = msg || '';
    error.hidden = !msg;
  }

  function irAPaso(n, enfocar) {
    paso = n;
    pasos.forEach(function (f, i) { f.hidden = (i + 1) !== n; });
    mostrarError('');
    if (btnAtras) btnAtras.hidden = n < 2;
    if (btnSig) btnSig.hidden = n !== 3;
    if (textoPaso) textoPaso.textContent = String(n);
    if (progreso) {
      progreso.setAttribute('aria-valuenow', String(n));
      progreso.style.setProperty('--progreso', (n / TOTAL * 100) + '%');
    }
    if (enfocar) enfocarLegend(pasos[n - 1]);
  }

  function enfocarLegend(fs) {
    var lg = fs && fs.querySelector('legend');
    if (!lg) return;
    lg.focus({ preventScroll: true });
    var r = form.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      form.scrollIntoView({ behavior: comp(), block: 'start' });
    }
  }

  function avanzar() {
    var n = paso;
    if (!marcados(NOMBRES[n - 1]).length) {
      mostrarError(n === 3 ? 'Elegí al menos una opción para seguir.' : 'Elegí una opción para seguir.');
      return;
    }
    if (n < TOTAL) irAPaso(n + 1, true);
    else terminar();
  }
  function retroceder() {
    clearTimeout(timerAvance);
    if (paso > 1) irAPaso(paso - 1, true);
  }

  /* ---------- Resultado ---------- */
  function lineas() {
    var l = [];
    l.push(['Necesito', etiquetas('necesidad').join(', ')]);
    l.push(['Mi negocio', etiquetas('rubro').join(', ')]);
    l.push(['Tiene que poder', etiquetas('funciones').join(', ')]);
    l.push(['Para cuándo', etiquetas('plazo').join(', ')]);
    return l;
  }

  function mensaje(reco) {
    var t = 'Hola José, vi tu página y quiero consultar por un proyecto:\n';
    lineas().forEach(function (p) { t += '- ' + p[0] + ': ' + p[1] + '\n'; });
    t += 'Me recomendaste: ' + reco.titulo + '.';
    return t;
  }

  function terminar() {
    clearTimeout(timerAvance);
    pasos.forEach(function (f) { f.hidden = true; });
    mostrarError('');
    if (navForm) navForm.hidden = true;
    if (cabecera) cabecera.hidden = true;

    var reco = RECOMENDACIONES[valor('necesidad')] || RECOMENDACIONES.otra;
    var ul = resultado.querySelector('[data-res-resumen]');
    ul.textContent = '';
    lineas().forEach(function (p) {
      var li = document.createElement('li');
      var b = document.createElement('strong');
      b.textContent = p[0] + ': ';
      li.appendChild(b);
      li.appendChild(document.createTextNode(p[1]));
      ul.appendChild(li);
    });
    resultado.querySelector('[data-res-reco-titulo]').textContent = reco.titulo;
    resultado.querySelector('[data-res-reco-texto]').textContent = reco.texto;

    var txt = mensaje(reco);
    linkWa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(txt);
    linkMail.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Consulta desde la web') +
      '&body=' + encodeURIComponent(txt);

    resultado.hidden = false;
    var h = resultado.querySelector('.resultado__titulo');
    if (h) h.focus({ preventScroll: true });
    var r = resultado.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.5) {
      resultado.scrollIntoView({ behavior: comp(), block: 'start' });
    }
  }

  // preseleccion: valor del paso 1 (viene de los botones de #problemas)
  function reiniciar(preseleccion) {
    clearTimeout(timerAvance);
    form.reset();
    if (preseleccion) {
      var r = form.querySelector('input[name="necesidad"][value="' + preseleccion + '"]');
      if (r) r.checked = true;
    }
    resultado.hidden = true;
    if (cabecera) cabecera.hidden = false;
    if (navForm) navForm.hidden = false;
    irAPaso(1, false);
  }

  /* ---------- Eventos ---------- */
  form.addEventListener('pointerdown', function () { ultimaTecla = ''; });
  form.addEventListener('keyup', function () { ultimaTecla = ''; });
  form.addEventListener('keydown', function (e) {
    ultimaTecla = e.key;
    var inp = e.target;
    if (e.key === 'Enter' && inp instanceof HTMLInputElement) {
      e.preventDefault();
      if (inp.type === 'radio') {
        inp.checked = true;
        clearTimeout(timerAvance);
        avanzar();
      } else if (inp.type === 'checkbox') {
        avanzar();
      }
    }
  });

  // Con 'click' (no 'change'): volver a tocar una opción ya marcada también avanza.
  form.addEventListener('click', function (e) {
    var inp = e.target;
    if (!(inp instanceof HTMLInputElement)) return;
    var n = NOMBRES.indexOf(inp.name) + 1;
    if (n !== paso) return;

    if (inp.type === 'checkbox') {
      // "No sé todavía" es excluyente con el resto
      if (inp.checked) {
        Array.prototype.forEach.call(form.querySelectorAll('input[name="funciones"]'), function (o) {
          if (o !== inp && ((inp.value === 'nose') || o.value === 'nose')) o.checked = false;
        });
      }
      mostrarError('');
      return;
    }
    if (inp.type !== 'radio') return;
    // Flechas: mueven la selección sin avanzar
    if (e.detail === 0 && /^Arrow/.test(ultimaTecla)) return;
    mostrarError('');
    clearTimeout(timerAvance);
    timerAvance = setTimeout(function () { if (paso === n) avanzar(); }, 250);
  });

  if (btnSig) btnSig.addEventListener('click', function () { clearTimeout(timerAvance); avanzar(); });
  if (btnAtras) btnAtras.addEventListener('click', retroceder);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  var btnReiniciar = form.querySelector('[data-reiniciar]');
  if (btnReiniciar) btnReiniciar.addEventListener('click', function () {
    reiniciar(null);
    enfocarLegend(pasos[0]);
  });

  /* Botones de #problemas: preseleccionan el paso 1 (necesidad) y llevan al cotizador. */
  document.querySelectorAll('#problemas .problema[data-solucion]').forEach(function (b) {
    b.addEventListener('click', function () {
      reiniciar(b.getAttribute('data-solucion'));
      var dest = document.getElementById('cotizar') || form;
      dest.scrollIntoView({ behavior: comp(), block: 'start' });
      setTimeout(function () {
        var lg = pasos[0].querySelector('legend');
        if (lg) lg.focus({ preventScroll: true });
      }, reducido.matches ? 0 : 400);
    });
  });

  irAPaso(1, false);
})();

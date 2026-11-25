/* codigo3d.js: fondo fijo de toda la página con paneles de código (C#, Java, JavaScript, C++, Android, SQL).
 * La cámara recorre un túnel largo en -z según el scroll de TODO el documento; los paneles se reciclan
 * (pool chico) y algunos se "escriben" al acercarse. ES module.
 * Si algo falla (sin WebGL, equipo muy justo) se sale y queda el fallback CSS del hero.
 */
import * as THREE from 'three';

(function () {
  'use strict';

  var canvas = document.getElementById('codigo3d');
  var hero = document.querySelector('.hero');
  if (!canvas) return;

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var angosto = window.innerWidth < 768;
  var tactil = window.matchMedia('(pointer: coarse)').matches;

  // Gama baja: celular con pocos núcleos -> fallback CSS.
  if ((navigator.hardwareConcurrency || 8) <= 4 && angosto) return;

  var esperar = window.requestIdleCallback
    ? function (fn) { window.requestIdleCallback(fn, { timeout: 600 }); }
    : function (fn) { setTimeout(fn, 300); };
  // Primero que se pinte la página; recién después se crea el renderer.
  requestAnimationFrame(function () { esperar(iniciar); });

  /* ---------- Código que se dibuja en los paneles ---------- */
  var LENGUAJES = {
    'C#': { color: '#a78bfa', snippets: [
      ['app.MapGet("/pedidos/{id}", (int id) =>', '    repo.Obtener(id));'],
      ['public async Task<IResult> Crear(PedidoDto dto)', '{', '    var p = await svc.CrearAsync(dto);', '    return Results.Ok(p);', '}'],
      ['await using var cmd = new NpgsqlCommand(sql, cn);', 'await cmd.ExecuteNonQueryAsync();'],
      ['var pedidos = await db.Pedidos', '    .Where(p => p.Estado == "Pendiente")', '    .ToListAsync();'],
      ['services.AddScoped<IPedidoRepo, PedidoRepo>();'],
      ['public record PedidoDto(int ClienteId);'],
      ['if (stock < cantidad)', '    throw new StockException();'],
      ['// el cliente recibe un mail al cambiar el estado', 'await mail.EnviarAsync(cliente.Email, asunto);'],
      ['app.UseAuthentication();', 'app.UseAuthorization();', 'app.MapControllers();']
    ] },
    'Java': { color: '#f59e0b', snippets: [
      ['@RestController', '@RequestMapping("/api")', 'public class ProductoController {'],
      ['@GetMapping("/productos")', 'public List<Producto> listar() {', '    return repo.findAll();', '}'],
      ['public ResponseEntity<Producto> buscar(', '        @PathVariable Long id) {', '    return ResponseEntity.ok(service.get(id));', '}'],
      ['List<Producto> lista = repo.findAll();'],
      ['@Entity', 'public class Cliente {', '    @Id @GeneratedValue', '    private Long id;', '    private String nombre;'],
      ['@PostMapping("/turnos")', 'public Turno crear(@RequestBody Turno t) {', '    return turnoRepo.save(t);', '}'],
      ['try (Connection cn = ds.getConnection()) {', '    ps.setLong(1, id);', '}'],
      ['String estado = pedido.getEstado();'],
      ['@Autowired', 'private PedidoService pedidoService;']
    ] },
    'JavaScript': { color: '#facc15', snippets: [
      ["const res = await fetch('/api/pedidos');", 'const pedidos = await res.json();'],
      ["document.querySelector('#carrito')", "    .addEventListener('click', agregar);"],
      ['export function calcularTotal(items) {', '  return items.reduce(', '    (t, i) => t + i.precio * i.cant, 0);', '}'],
      ['const nombre = form.nombre.value.trim();', 'if (!nombre) return mostrarError();'],
      ['catalogo.forEach(p => {', '  lista.append(crearTarjeta(p));', '});'],
      ['// guardo el carrito en el navegador', "localStorage.setItem('c', JSON.stringify(c));"],
      ['const total = items.length > 0 ? calcular() : 0;'],
      ['async function cargar() {', '  try { return await api.get(); }', '  catch (e) { console.error(e); }', '}'],
      ['window.addEventListener("scroll", animar);']
    ] },
    'C++': { color: '#60a5fa', snippets: [
      ['#include <iostream>', '#include <vector>', 'using namespace std;'],
      ['std::vector<Pasaje> pasajes;'],
      ['archivo.read(reinterpret_cast<char*>(&reg),', '             sizeof(reg));'],
      ['struct Pasaje {', '    int numero;', '    char destino[30];', '    float precio;', '};'],
      ['for (int i = 0; i < n; i++) {', '    total += pasajes[i].precio;', '}'],
      ['ofstream archivo("datos.dat", ios::binary);', 'archivo.write((char*)&reg, sizeof(reg));'],
      ['int main() {', '    cout << "Total: " << total << endl;', '    return 0;', '}'],
      ['if (!archivo.is_open()) return -1;'],
      ['void ordenar(vector<Pasaje>& v) {', '    sort(v.begin(), v.end());', '}']
    ] },
    'Android': { color: '#34D399', snippets: [
      ['public class MainActivity', '        extends AppCompatActivity {'],
      ['setContentView(R.layout.activity_main);'],
      ['SQLiteDatabase db = helper.getWritableDatabase();'],
      ['<Button', '    android:id="@+id/btnGuardar"', '    android:layout_width="match_parent"', '    android:text="Guardar" />'],
      ['RecyclerView rv = findViewById(R.id.lista);', 'rv.setLayoutManager(new LinearLayoutManager(this));'],
      ['btnGuardar.setOnClickListener(v -> {', '    guardarPedido();', '});'],
      ['ContentValues cv = new ContentValues();', 'cv.put("nombre", nombre);', 'db.insert("clientes", null, cv);'],
      ['<TextView', '    android:id="@+id/txtTotal"', '    android:textSize="18sp" />'],
      ['Cursor c = db.rawQuery(sql, null);']
    ] },
    'SQL': { color: '#48dbfb', snippets: [
      ['SELECT c.nombre, COUNT(p.id)', 'FROM clientes c', 'JOIN pedidos p ON p.cliente_id = c.id', 'GROUP BY c.nombre;'],
      ["UPDATE pedidos SET estado = 'Enviado'", 'WHERE id = @id;'],
      ['CREATE TABLE productos (', '  id SERIAL PRIMARY KEY,', '  nombre VARCHAR(80) NOT NULL', ');'],
      ['BEGIN TRANSACTION;', 'UPDATE stock SET cant = cant - 1', 'WHERE producto_id = 7;', 'COMMIT;'],
      ['SELECT * FROM productos WHERE stock > 0', 'ORDER BY nombre LIMIT 20;'],
      ['INSERT INTO turnos (cliente_id, fecha)', "VALUES (12, '2026-12-03');"],
      ['SELECT SUM(total) FROM pedidos', 'WHERE fecha >= CURRENT_DATE - 30;'],
      ['CREATE INDEX idx_pedidos_estado', 'ON pedidos (estado);'],
      ['DELETE FROM carrito WHERE usuario_id = 4;']
    ] }
  };
  var NOMBRES_LENG = Object.keys(LENGUAJES);

  var COLOR = {
    kw: '#48dbfb', str: '#34D399', tipo: '#E6EDF3', com: '#94A3B8', num: '#F59E0B', txt: '#B9C6D6', err: '#F87171'
  };
  var KEYWORDS = {};
  ('var let const new return if else for foreach while await async try catch throw using import export function true false null this ' +
   'public private protected static class extends implements void int long float double bool char string final override record struct ' +
   'namespace include SELECT FROM JOIN ON WHERE GROUP BY UPDATE SET INSERT INTO VALUES CREATE TABLE PRIMARY KEY NOT NULL ORDER LIMIT ' +
   'COUNT SUM DELETE INDEX BEGIN TRANSACTION COMMIT SERIAL VARCHAR CURRENT_DATE')
    .split(' ').forEach(function (k) { KEYWORDS[k] = 1; });

  var RE = /(\/\/.*|--.*)|("[^"]*"|'[^']*')|(\b\d+\b)|(@?[A-Za-z_][A-Za-z0-9_]*)|(\s+|.)/g;
  var RE_XML = /(<\/?[A-Za-z][\w.]*)|(android:\w+)|("[^"]*")|(\s+|.)/g;

  function agregar(out, texto, color, col) {
    var ult = out[out.length - 1];
    if (ult && ult.color === color && ult.col + ult.texto.length === col) ult.texto += texto;
    else out.push({ col: col, texto: texto, color: color });
  }

  // Parte una línea en tramos del mismo color: [{col, texto, color}]
  function tramos(linea, lang) {
    var out = [], m, col = 0, t;
    var inc = /^(\s*)(#\w+)(\s+)(.*)$/.exec(linea);
    if (inc) {
      agregar(out, inc[1] + inc[2], COLOR.kw, 0);
      agregar(out, inc[3], COLOR.txt, inc[1].length + inc[2].length);
      agregar(out, inc[4], COLOR.str, inc[1].length + inc[2].length + inc[3].length);
      return out;
    }
    if (lang === 'Android' && /^\s*(<|android:|\/>)/.test(linea)) {
      RE_XML.lastIndex = 0;
      while ((m = RE_XML.exec(linea)) !== null) {
        t = m[0];
        agregar(out, t, m[1] ? COLOR.kw : m[2] ? COLOR.tipo : m[3] ? COLOR.str : COLOR.txt, col);
        col += t.length;
      }
      return out;
    }
    RE.lastIndex = 0;
    while ((m = RE.exec(linea)) !== null) {
      t = m[0];
      var c = COLOR.txt;
      if (m[1]) c = COLOR.com;
      else if (m[2]) c = COLOR.str;
      else if (m[3]) c = COLOR.num;
      else if (m[4]) {
        if (t.charAt(0) === '@' || KEYWORDS[t]) c = COLOR.kw;
        else if (/^[A-Z]/.test(t)) c = COLOR.tipo;
      }
      agregar(out, t, c, col);
      col += t.length;
    }
    return out;
  }

  /* ---------- Estado ---------- */
  var renderer, scene, camera, geom, paneles = [], medidor;
  var ro, corriendo = false, raf = 0, ultimo = 0, ultimoRender = 0, ultimaActividad = 0;
  var camZ = 0, derivaZ = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
  var heroAlto = 0, opacidadFondo = '1';
  var frames = 0, quitado = false, escribiendo = 0, contLeng = 0, estaticoPendiente = false;
  var SPAN = 140;          // largo del volumen visible (se envuelve)
  var TUNEL = 600;         // recorrido total de la cámara
  var RANGO_TIPEO = 50;    // distancia a la que empieza a escribirse
  var CPS = 38;            // caracteres por segundo
  var MAX_REDIBUJOS = 6;
  var ALTO_TEX = 256;
  window.__codigo3dFrames = 0; // solo contador para depuración

  function aleatorio(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // Calcula (una sola vez por snippet) tramos, tamaño de letra y alto usado de la textura.
  function preparar(lang, snip) {
    if (snip.prep) return snip.prep;
    var maxLen = 0, total = 0, runs = [], off = 0;
    snip.forEach(function (l, li) {
      if (l.length > maxLen) maxLen = l.length;
      total += l.length;
      tramos(l, lang).forEach(function (t) {
        runs.push({ linea: li, col: t.col, texto: t.texto, color: t.color, off: off + t.col });
      });
      off += l.length;
    });
    var fs = Math.min(26, Math.floor(470 / (maxLen * 0.6)));
    medidor.font = fs + 'px Consolas, "Courier New", monospace';
    snip.prep = {
      lang: lang, lineas: snip, runs: runs, total: total, fs: fs,
      charW: medidor.measureText('M').width,
      usado: snip.length <= 2 ? 128 : (snip.length <= 4 ? 192 : 256)
    };
    return snip.prep;
  }

  function crearPanel() {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = ALTO_TEX;
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    return {
      mesh: mesh, mat: mat, tex: tex, ctx: cv.getContext('2d'), prep: null, lang: '',
      x: 0, y: 0, z: 0, fase: 0, dim: 1, nacido: 0,
      tipea: false, error: false, activo: false,
      tipeado: 0, mostrado: 0, estado: 0, espera: 0,
      dibujado: -1, dibujadoEstado: -1, dibujadoCursor: -1
    };
  }

  // Le da al panel un snippet nuevo, otra posición lateral y reinicia el tipeo.
  function reubicar(p, z, t, estatico) {
    var lang = NOMBRES_LENG[contLeng++ % NOMBRES_LENG.length];
    var lista = LENGUAJES[lang].snippets;
    var prep = preparar(lang, lista[(Math.random() * lista.length) | 0]);
    if (prep === p.prep) prep = preparar(lang, lista[(Math.random() * lista.length) | 0]);
    p.prep = prep; p.lang = lang;

    var w = aleatorio(7, 14);
    p.mesh.scale.set(w, w * prep.usado / 512, 1);
    p.tex.repeat.set(1, prep.usado / ALTO_TEX);
    p.tex.offset.set(0, 1 - prep.usado / ALTO_TEX);

    var xs = clamp(camera.aspect / 1.8, 0.35, 1.3);
    var r = Math.random();
    p.dim = 1;
    if (r < 0.65) p.x = aleatorio(10, 36) * xs;
    else if (r < 0.9) p.x = -aleatorio(18, 36) * xs;
    else { p.x = aleatorio(-16, 8) * xs; p.dim = 0.55; } // detrás de la columna de texto: más tenue
    if (angosto) p.dim *= 0.7; // en celular el texto ocupa casi todo el ancho
    p.y = aleatorio(-14, 14);
    p.z = z;
    p.fase = aleatorio(0, 6.28);
    p.nacido = estatico ? -10 : t;

    p.tipea = !estatico && Math.random() < 0.4;
    p.error = p.tipea && Math.random() < 0.4;
    p.activo = false; p.espera = 0;
    if (p.tipea) { p.tipeado = 0; p.mostrado = 0; p.estado = 0; }
    else { p.tipeado = prep.total; p.mostrado = prep.total; p.estado = 2; }
    p.dibujado = -1; p.dibujadoEstado = -1; p.dibujadoCursor = -1;
    p.mesh.visible = false;
  }

  // Dibuja los primeros n caracteres. estado 0 escribiendo, 1 error, 2 resuelto.
  function dibujar(p, n, estado, cursor) {
    var q = p.prep, ctx = p.ctx, fs = q.fs, cw = 512, ch = q.usado;
    var col = LENGUAJES[p.lang].color;
    ctx.clearRect(0, 0, cw, ALTO_TEX);
    ctx.fillStyle = 'rgba(26,34,48,0.55)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(2, 2, cw - 4, ch - 4, 14); else ctx.rect(2, 2, cw - 4, ch - 4);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // etiqueta del lenguaje, en la esquina
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    var anchoEt = ctx.measureText(p.lang).width;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = col;
    ctx.fillText(p.lang, cw - 16 - anchoEt, 24);
    ctx.globalAlpha = 1;

    ctx.font = fs + 'px Consolas, "Courier New", monospace';
    var lh = fs * 1.4, x0 = 18, y0 = 34 + fs;
    for (var i = 0; i < q.runs.length; i++) {
      var run = q.runs[i];
      var resta = n - run.off;
      if (resta <= 0) break;
      ctx.fillStyle = run.color;
      ctx.fillText(resta >= run.texto.length ? run.texto : run.texto.slice(0, resta), x0 + run.col * q.charW, y0 + run.linea * lh);
    }
    if (estado === 1) {
      ctx.fillStyle = COLOR.err;
      for (var l = 0; l < q.lineas.length; l++) ctx.fillRect(x0, y0 + l * lh + 4, q.lineas[l].length * q.charW, 2);
    } else if (estado === 2 && p.error) {
      ctx.fillStyle = COLOR.str;
      ctx.font = 'bold ' + Math.round(fs * 1.3) + 'px sans-serif';
      ctx.fillText('✓', cw - 20 - fs * 1.3, ch - 14);
    } else if (estado === 0 && cursor === 1 && n < q.total) {
      // cursor parpadeante (bloque tipo ▍)
      var acum = 0, li = 0;
      while (li < q.lineas.length - 1 && n > acum + q.lineas[li].length) { acum += q.lineas[li].length; li++; }
      ctx.fillStyle = COLOR.kw;
      ctx.fillRect(x0 + (n - acum) * q.charW, y0 + li * lh - fs * 0.85, Math.max(3, q.charW * 0.45), fs);
    }
    p.dibujado = n; p.dibujadoEstado = estado; p.dibujadoCursor = cursor;
    p.tex.needsUpdate = true;
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    if (quitado) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('codigo3d: no hay WebGL, queda el fondo de código estático.', e);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, angosto ? 1.25 : 1.5));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 170);
    geom = new THREE.PlaneGeometry(1, 1);
    medidor = document.createElement('canvas').getContext('2d');
    medir();

    var cantidad = angosto ? 20 : 40;
    camZ = objetivoZ();
    for (var i = 0; i < cantidad; i++) {
      var p = crearPanel();
      reubicar(p, camZ - aleatorio(5, SPAN - 10), 0, reducido);
      paneles.push(p);
      scene.add(p.mesh);
    }

    ro = new ResizeObserver(function () { medir(); pedirEstatico(); });
    ro.observe(canvas);
    window.addEventListener('pagehide', liberar);

    if (reducido) {
      // Cuadro estático: todo escrito, se vuelve a dibujar solo al hacer scroll.
      window.addEventListener('scroll', pedirEstatico, { passive: true });
      window.addEventListener('scroll', atenuarFondo, { passive: true });
      cuadroEstatico();
      if (hero) hero.classList.add('hero--3d');
      return;
    }

    if (!tactil) {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        tmx = (e.clientX / window.innerWidth) * 2 - 1;
        tmy = -((e.clientY / window.innerHeight) * 2 - 1);
        ultimaActividad = performance.now();
      }, { passive: true });
    }
    var marcar = function () { ultimaActividad = performance.now(); };
    window.addEventListener('scroll', marcar, { passive: true });
    window.addEventListener('scroll', atenuarFondo, { passive: true });
    window.addEventListener('wheel', marcar, { passive: true });
    window.addEventListener('touchmove', marcar, { passive: true });
    document.addEventListener('visibilitychange', actualizarLoop);

    ultimaActividad = performance.now();
    renderizar();
    if (hero) hero.classList.add('hero--3d');
    actualizarLoop();
  }

  function medir() {
    var w = Math.max(1, canvas.clientWidth || window.innerWidth);
    var h = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    heroAlto = hero ? hero.offsetHeight : 0;
    atenuarFondo();
  }

  // Fuera del hero el fondo sigue visible pero más tenue (la transición la pone el CSS).
  function atenuarFondo() {
    if (!hero) return;
    var o = window.scrollY > heroAlto * 0.8 ? '0.6' : '1';
    if (o !== opacidadFondo) { opacidadFondo = o; canvas.style.opacity = o; }
  }

  // Progreso de TODO el documento (0 a 1) y su posición en el túnel.
  function progresoScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  }
  function objetivoZ() { return -progresoScroll() * TUNEL - derivaZ; }

  function actualizarLoop() {
    var debe = !document.hidden && !quitado;
    if (debe && !corriendo) {
      corriendo = true;
      ultimo = performance.now();
      raf = requestAnimationFrame(bucle);
    } else if (!debe && corriendo) {
      corriendo = false;
      cancelAnimationFrame(raf);
    }
  }

  // Posiciona, recicla y calcula opacidad. Sin crear objetos.
  function actualizarPaneles(t, estatico) {
    for (var i = 0; i < paneles.length; i++) {
      var p = paneles[i];
      // Los que quedan atrás de la cámara reaparecen adelante (y al revés al subir).
      if (p.z > camZ + 5) {
        reubicar(p, p.z - SPAN * Math.ceil((p.z - camZ - 5) / SPAN), t, estatico);
      } else if (p.z < camZ - SPAN + 5) {
        reubicar(p, p.z + SPAN * Math.ceil((camZ - SPAN + 5 - p.z) / SPAN), t, estatico);
      }
      var d = camZ - p.z;
      var cerca = clamp(d / 8, 0, 1);
      var lej = clamp((d - 85) / 50, 0, 1);
      var base = 0.4 - 0.17 * clamp(d / 90, 0, 1);
      var nace = clamp((t - p.nacido) / 0.7, 0, 1);
      var a = cerca * (1 - lej * lej * (3 - 2 * lej)) * base * p.dim * nace;
      // Celular, en el hero: más tenues los paneles detrás del bloque de texto (85% izquierdo).
      if (angosto && d > 0 && window.scrollY < heroAlto) {
        var ndc = (p.x - camera.position.x) / (d * 0.5774 * camera.aspect);
        if ((ndc + 1) / 2 < 0.85) a *= 0.45;
      }
      p.mat.opacity = a;
      p.mesh.visible = a > 0.01 && p.dibujado !== -1;
      p.mesh.position.set(p.x, p.y + (estatico ? 0 : Math.sin(t * 0.5 + p.fase) * 0.35), p.z);
    }
  }

  function necesitaDibujo(p, cursor) {
    return p.dibujado !== p.mostrado || p.dibujadoEstado !== p.estado ||
      (p.estado === 0 && p.activo && p.dibujadoCursor !== cursor);
  }

  function renderizar() {
    renderer.render(scene, camera);
    frames++;
    window.__codigo3dFrames = frames;
  }

  // Solo reduced-motion: re-renderiza un cuadro estático (en scroll o resize).
  function pedirEstatico() {
    if (!reducido || estaticoPendiente || quitado) return;
    estaticoPendiente = true;
    requestAnimationFrame(function () { estaticoPendiente = false; cuadroEstatico(); });
  }
  function cuadroEstatico() {
    if (quitado) return;
    camZ = objetivoZ();
    camera.position.set(0, 0, camZ);
    actualizarPaneles(0, true);
    for (var i = 0; i < paneles.length; i++) {
      var p = paneles[i];
      if (p.dibujado === -1) dibujar(p, p.mostrado, 2, 0);
    }
    actualizarPaneles(0, true);
    renderizar();
  }

  function bucle(ahora) {
    if (!corriendo) return;
    raf = requestAnimationFrame(bucle);
    // Tope de 60 fps; en reposo (sin scroll ni mouse) bajamos a ~22 fps.
    var ocioso = ahora - ultimaActividad > 1500;
    if (ahora - ultimoRender < (ocioso ? 45 : 16)) return;
    ultimoRender = ahora;
    var dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;
    var t = ahora / 1000;

    derivaZ += dt * 0.8;
    var k = Math.min(1, dt * 3);
    camZ += (objetivoZ() - camZ) * k;   // lerp suave hacia la posición del scroll
    mx += (tmx - mx) * k;
    my += (tmy - my) * k;
    camera.position.set(mx * 0.6, my * 0.6, camZ);

    actualizarPaneles(t, false);

    var cursor = ((t * 2.5) | 0) & 1;
    escribiendo = 0;
    for (var i = 0; i < paneles.length; i++) {
      var p = paneles[i];
      if (!p.tipea) continue;
      var d = camZ - p.z;
      p.activo = d > 0 && d < RANGO_TIPEO;
      if (!p.activo) continue;
      if (p.estado === 0) {
        escribiendo++;
        p.tipeado += CPS * dt;
        var n = Math.min(p.prep.total, Math.floor(p.tipeado));
        p.mostrado = n;
        if (n >= p.prep.total) { p.estado = p.error ? 1 : 2; p.espera = 1.3; }
      } else if (p.estado === 1) {
        escribiendo++;
        p.espera -= dt;
        if (p.espera <= 0) p.estado = 2;
      }
    }

    // Redibujo con tope por cuadro; primero los paneles que todavía no tienen nada dibujado.
    var presupuesto = MAX_REDIBUJOS, j, q;
    for (j = 0; j < paneles.length && presupuesto > 0; j++) {
      q = paneles[j];
      if (q.dibujado === -1 && q.mat.opacity > 0.005) { dibujar(q, q.mostrado, q.estado, cursor); presupuesto--; }
    }
    for (j = 0; j < paneles.length && presupuesto > 0; j++) {
      q = paneles[j];
      if (q.dibujado !== -1 && q.mesh.visible && necesitaDibujo(q, cursor)) {
        dibujar(q, q.mostrado, q.estado, cursor); presupuesto--;
      }
    }

    renderizar();
  }

  function liberar() {
    quitado = true;
    corriendo = false;
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    document.removeEventListener('visibilitychange', actualizarLoop);
    paneles.forEach(function (p) { p.tex.dispose(); p.mat.dispose(); });
    if (geom) geom.dispose();
    if (renderer) renderer.dispose();
  }
})();

// ---------- Menú lateral ----------
const btnMenu = document.getElementById("btn_menu");
const btnCerrar = document.getElementById("btn_cerrar");
const menu = document.getElementById("menu_lateral");
const overlay = document.getElementById("overlay");

function abrirMenu() {
    menu.classList.add("abierto");
    overlay.classList.add("activo");
    document.body.classList.add("sin-scroll");
    menu.setAttribute("aria-hidden", "false");
    btnMenu.setAttribute("aria-expanded", "true");
    btnCerrar.focus();
}

function cerrarMenu() {
    if (!menu.classList.contains("abierto")) return;
    menu.classList.remove("abierto");
    overlay.classList.remove("activo");
    document.body.classList.remove("sin-scroll");
    menu.setAttribute("aria-hidden", "true");
    btnMenu.setAttribute("aria-expanded", "false");
    btnMenu.focus({ preventScroll: true });
}

btnMenu.addEventListener("click", abrirMenu);
btnCerrar.addEventListener("click", cerrarMenu);
overlay.addEventListener("click", cerrarMenu);
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", cerrarMenu));

document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarMenu();
});

// Si la ventana pasa a tamaño escritorio con el menú abierto, se cierra.
window.matchMedia("(min-width: 992px)").addEventListener("change", e => {
    if (e.matches) cerrarMenu();
});

// ---------- Aparición de secciones al scrollear ----------
const revelables = document.querySelectorAll(".revelar");

if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.08 });

    revelables.forEach(el => observador.observe(el));
} else {
    revelables.forEach(el => el.classList.add("visible"));
}

// ---------- Sección activa en el menú de escritorio ----------
const linksNav = document.querySelectorAll(".links a[href^='#']");
const secciones = [...linksNav]
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if ("IntersectionObserver" in window && secciones.length) {
    const observadorNav = new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
            if (!entrada.isIntersecting) return;
            linksNav.forEach(link => {
                link.classList.toggle("activo", link.getAttribute("href") === "#" + entrada.target.id);
            });
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    secciones.forEach(sec => observadorNav.observe(sec));
}

// ---------- Año del footer ----------
const anio = document.getElementById("anio");
if (anio) anio.textContent = new Date().getFullYear();

const btnmenu = document.getElementById("btn_menu"); 
const menu = document.getElementById("menu_lateral"); 
const btn_cerrar = document.getElementById("btn_cerrar");
const overlay = document.getElementById("overlay");

btnmenu.addEventListener("click", () => {
    menu.classList.toggle("abierto");
    overlay.classList.toggle("activo");
});

btn_cerrar.addEventListener("click", () => {
    menu.classList.remove("abierto"); 
    overlay.classList.remove("activo");
});

overlay.addEventListener("click", () => {
    menu.classList.remove("abierto");
    overlay.classList.remove("activo");
});

const proyecto1 = document.getElementById("btn_proyecto1");

proyecto1.addEventListener("click", () => {
    window.location.href = "https://github.com/JoseZenteno269/PROYECTO-CLINICA";
    
});

const proyecto2 = document.getElementById("btn_proyecto2"); 

proyecto2.addEventListener("click", () => {
    window.location.href = "https://github.com/JoseZenteno269/SISTEMA-DE-GESTION-TRASNPORTE";
});

const links = document.querySelectorAll(".menu_lateral a");
const menulateral = document.querySelector(".menu_lateral");

links.forEach(link => {
    link.addEventListener("click", () => {
        menulateral.classList.remove("abierto");
        overlay.classList.remove("activo");
    });
});
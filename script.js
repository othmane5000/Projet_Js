
const sidebar = document.getElementById("sidebar");
const menubtn = document.getElementById("menubtn");
const main = document.getElementById("main");
const navlink = document.querySelectorAll("#sidebar nav a");
const section = document.querySelectorAll("main section");


const totalFilms = document.getElementById("totalFilms");
const totalDirectors = document.getElementById("totalDirectors");


menubtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

navlink.forEach(lien => {
    lien.addEventListener("click", (event) => {
        event.preventDefault();
        section.forEach(s => {
            s.style.display = "none";
        });
       const cibleId = lien.getAttribute("href").substring(1); 
        const cibleSection = document.getElementById(cibleId);
        
        if (cibleSection) {
            cibleSection.style.display = "block";
        }

        
        sidebar.classList.remove("open");
    });
});

window.onload = () => {
    section.forEach(s => s.style.display = "none");
    document.getElementById("dashboard").style.display = "block";
};
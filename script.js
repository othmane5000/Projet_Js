const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const sections = document.querySelectorAll("main section");
const searchInput = document.getElementById("searchInput");
let films = JSON.parse(localStorage.getItem("films")) || [];
const filmForm = document.getElementById("filmForm");
const filmsList = document.getElementById("filmsList");
const genreFilter = document.getElementById("genreFilter");
const directorSelect = document.getElementById("directorSelect");
let directors = JSON.parse(localStorage.getItem("directors")) || [];
const directorForm = document.getElementById("directorForm");
const directorNameInput = document.getElementById("directorName");
const directorsList = document.getElementById("directorsList");
const totalFilmsEl = document.getElementById("totalFilms");
const totalDirectorsEl = document.getElementById("totalDirectors");
let genreChart;

menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

document.querySelectorAll("#sidebar nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.getAttribute("href").substring(1);
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    sidebar.classList.remove("open");
  });
});

//directors

function updateDirectorSelect() {
  directorSelect.innerHTML = '<option value="">Select director</option>';
  directors.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    directorSelect.appendChild(opt);
  });
}

  function renderDirectors() {
    directorsList.innerHTML = "";
    directors.forEach((d, i) => {
      const div = document.createElement("div");
      div.className = "director-item";
      div.innerHTML = `<span>${d}</span><button onclick="deleteDirector(${i})"><i class="fa-solid fa-trash"></i></button>`;
      directorsList.appendChild(div);
    });
}

function deleteDirector(index) {
  if(confirm("Delete this director?")){
    const name = directors[index];
    directors.splice(index,1);
    films = films.filter(f => f.director !== name);
    saveData();
    renderDirectors();
    renderFilms();
    updateDashboard();
    updateGenreFilter();
  }
}

directorForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = directorNameInput.value.trim();
  if(name && !directors.includes(name)){
    directors.push(name);
    directorNameInput.value = "";
    saveData();
    updateDirectorSelect();
    renderDirectors();
  }
});
// FILMS
function renderFilms(filterGenre="", search="") {
  filmsList.innerHTML = "";
  let filtered = films;
  if(filterGenre) filtered = filtered.filter(f => f.genre.toLowerCase() === filterGenre.toLowerCase());
  if(search) filtered = filtered.filter(f => f.title.toLowerCase().includes(search.toLowerCase()) || f.director.toLowerCase().includes(search.toLowerCase()));
  filtered.forEach((f,i)=>{
    const card = document.createElement("div");
    card.className = "film-card";
    card.innerHTML = `
      <img src="${f.poster || "https://via.placeholder.com/300x450?text=Film"}" alt="${f.title}">
      <div class="info">
        <h4>${f.title}</h4>
        <p>${f.year} • ${f.genre} • ${f.duration} min</p>
        <p>${f.director}</p>
        <div class="card-actions">
          <button class="edit" onclick="editFilm(${i})"><i class="fa-solid fa-pen"></i></button>
          <button class="delete" onclick="deleteFilm(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    filmsList.appendChild(card);
  });
}

function deleteFilm(index){
  if(confirm("Delete this film?")){
    films.splice(index,1);
    saveData();
    renderFilms();
    updateDashboard();
    updateGenreFilter();
  }
}

function editFilm(index){
  const film = films[index];
  document.getElementById("title").value = film.title;
  document.getElementById("genre").value = film.genre;
  document.getElementById("year").value = film.year;
  document.getElementById("duration").value = film.duration;
  document.getElementById("poster").value = film.poster;
  directorSelect.value = film.director;
  filmForm.dataset.editIndex = index;
  sections.forEach(sec => sec.classList.remove("active"));
  document.getElementById("add").classList.add("active");
}

filmForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const filmData = {
    title: document.getElementById("title").value.trim(),
    genre: document.getElementById("genre").value.trim(),
    year: document.getElementById("year").value,
    duration: document.getElementById("duration").value,
    poster: document.getElementById("poster").value.trim(),
    director: directorSelect.value
  };
  const editIndex = filmForm.dataset.editIndex;
  if(editIndex!==undefined){
    films[editIndex] = filmData;
    delete filmForm.dataset.editIndex;
  } else {
    films.push(filmData);
  }
  filmForm.reset();
  saveData();
  renderFilms();
  updateDashboard();
  updateGenreFilter();
});

// SEARCH 
searchInput.addEventListener("input",()=> renderFilms(genreFilter.value, searchInput.value));
genreFilter.addEventListener("change", ()=> renderFilms(genreFilter.value, searchInput.value));

function updateGenreFilter(){
  const genres = [...new Set(films.map(f=>f.genre).filter(g=>g))];
  genreFilter.innerHTML = '<option value="">All genres</option>';
  genres.forEach(g=>{
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreFilter.appendChild(opt);
  });
}

function updateDashboard(){
  totalFilmsEl.textContent = films.length;
  totalDirectorsEl.textContent = directors.length;
  renderChart();
}

function renderChart(){
  const ctx = document.getElementById("genreChart").getContext("2d");
  const genreCounts = {};
  films.forEach(f=> { if(f.genre) genreCounts[f.genre] = (genreCounts[f.genre]||0)+1; });
  const data = {
    labels: Object.keys(genreCounts),
    datasets:[{
      label:"Films by Genre",
      data:Object.values(genreCounts),
      backgroundColor:Object.keys(genreCounts).map(_=>"rgba(245,197,24,0.7)"),
      borderColor:"rgba(245,197,24,1)",
      borderWidth:1
    }]
  }
  if(genreChart) genreChart.destroy();
  genreChart = new Chart(ctx,{type:"bar", data:data, options:{plugins:{legend:{display:false}}}});
}

function saveData(){
  localStorage.setItem("films", JSON.stringify(films));
  localStorage.setItem("directors", JSON.stringify(directors));
}

updateDirectorSelect();
renderDirectors();
renderFilms();
updateGenreFilter();
updateDashboard();
sections.forEach(s => s.classList.remove("active"));
document.getElementById("dashboard").classList.add("active");

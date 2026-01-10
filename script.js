// VARIABLES & DOM ELEMENTS
const films = JSON.parse(localStorage.getItem('films')) || [];
const directors = JSON.parse(localStorage.getItem('directors')) || [];
let filteredFilms = [];
let genreChart = null;
let yearChart = null;
let editingFilmId = null;

// Sidebar & Header
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
let overlay;

// Films Section
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const filmsList = document.getElementById('filmsList');
const resetBtn = document.getElementById('resetBtn');

// Add Film Section
const filmForm = document.getElementById('filmForm');

// Directors Section
const directorsList = document.getElementById('directorsList');
const filmDirectorSelect = document.getElementById('filmDirector');
const modal = document.getElementById('modal');
const modalDirName = document.getElementById('modalDirName');

// Dashboard Section
const totalFilmsEl = document.getElementById('totalFilms');
const totalDirectorsEl = document.getElementById('totalDirectors');
const avgRatingEl = document.getElementById('avgRating');
const topGenreEl = document.getElementById('topGenre');
const topFilmsEl = document.getElementById('topFilms');
const recommendationsEl = document.getElementById('recommendations');

// API Section
const apiBtn = document.getElementById('apiBtn');
const apiInput = document.getElementById('apiInput');
const apiResult = document.getElementById('apiResult');
const apiLoading = document.getElementById('apiLoading');

// EVENT LISTENERS - INITIALIZATION
menuBtn.addEventListener('click', toggleSidebar);
filmForm.addEventListener('submit', addFilm);
resetBtn.addEventListener('click', resetFilters);
apiBtn.addEventListener('click', searchOmdb);
genreFilter.addEventListener('change', filterByGenre);
searchInput.addEventListener('input', searchFilms);

document.querySelectorAll('#sidebar nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = link.getAttribute('onclick').match(/'([^']*)'/)[1];
    switchSection(target);
  });
});

window.addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
  overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', toggleSidebar);
  
  // Masquer la barre de recherche  
  document.querySelector('.header-search').style.display = 'none';
  
  renderDirectors();
  updateDirectorSelect();
  renderFilms();
  updateGenreFilter();
  updateDashboard();
});


// GLOBAL / NAVIGATION FUNCTIONS

function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function switchSection(sectionId) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  
  // Afficher/masquer la barre de recherche selon la section active
  const searchBar = document.querySelector('.header-search');
  if (sectionId === 'films') {
    searchBar.style.display = 'flex';
  } else {
    searchBar.style.display = 'none';
  }
}

// SAVE DATA FUNCTION

function saveData() {
  localStorage.setItem('films', JSON.stringify(films));
  localStorage.setItem('directors', JSON.stringify(directors));
}

// PAGE FILMS 

function addFilm(e) {
  e.preventDefault();
  const title = document.getElementById('filmTitle').value.trim();
  const genre = document.getElementById('filmGenre').value;
  const year = document.getElementById('filmYear').value;
  const duration = document.getElementById('filmDuration').value;
  const directorId = document.getElementById('filmDirector').value;
  const rating = parseFloat(document.getElementById('filmRating').value);
  const poster = document.getElementById('filmPoster').value.trim();
  
  if (!title || !genre || !year || !duration || !directorId) {
    alert('Remplissez tous les champs requis!');
    return;
  }
  
  const directorName = directors.find(d => d.id == directorId)?.name || 'Inconnu';
  if (editingFilmId !== null) {
    const filmIndex = films.findIndex(f => f.id === editingFilmId);
    if (filmIndex > -1) {
      films[filmIndex] = {
        id: editingFilmId,
        title,
        genre,
        year: parseInt(year),
        duration: parseInt(duration),
        directorId: parseInt(directorId),
        directorName,
        rating: rating || 7,
        poster: poster || 'https://via.placeholder.com/200x300?text=No+Image'
      };
      alert('Film modifié avec succès!');
      editingFilmId = null;
      document.querySelector('#filmForm button[type="submit"]').innerHTML = '<i class="fa-solid fa-save"></i> Enregistrer';
    }
  } else {
    const film = {
      id: Date.now(),
      title,
      genre,
      year: parseInt(year),
      duration: parseInt(duration),
      directorId: parseInt(directorId),
      directorName,
      rating: rating || 7,
      poster: poster || 'https://via.placeholder.com/200x300?text=No+Image'
    }; 
    films.push(film);
    alert('Film ajouté avec succès!');
  }
  
  saveData();
  filmForm.reset();
  renderFilms();
  updateDashboard();
}

function deleteFilm(id) {
  if (confirm('Supprimer ce film?')) {
    const index = films.findIndex(f => f.id === id);
    if (index > -1) {
      films.splice(index, 1);
      saveData();
      renderFilms();
      updateDashboard();
    }
  }
}

function modifierFilm(id) {
  const film = films.find(f => f.id === id);
  if (!film) {
    alert('Film non trouvé!');
    return;
  }
  document.getElementById('filmTitle').value = film.title;
  document.getElementById('filmGenre').value = film.genre;
  document.getElementById('filmYear').value = film.year;
  document.getElementById('filmDuration').value = film.duration;
  document.getElementById('filmDirector').value = film.directorId;
  document.getElementById('filmRating').value = film.rating;
  document.getElementById('filmPoster').value = film.poster;
  editingFilmId = id;
  document.querySelector('#filmForm button[type="submit"]').innerHTML = '<i class="fa-solid fa-edit"></i> Modifier';
  switchSection('add');
}

function renderFilms() {
  filmsList.innerHTML = '';
  const toShow = filteredFilms.length > 0 ? filteredFilms : films;
  
  if (toShow.length === 0) {
    filmsList.innerHTML = '<p style="color: var(--muted);">Aucun film trouvé</p>';
    return;
  }
  
  toShow.forEach(film => {
    const card = document.createElement('div');
    card.className = 'film-card';
    card.innerHTML = `
      <img src="${film.poster}" alt="${film.title}">
      <div class="info">
        <h4>${film.title}</h4>
        <p><strong>Genre:</strong> ${film.genre}</p>
        <p><strong>Année:</strong> ${film.year}</p>
        <p><strong>Durée:</strong> ${film.duration} min</p>
        <p><strong>Réal:</strong> ${film.directorName}</p>
        <p><strong>Note:</strong> ${film.rating}/10</p>
      </div>
      <button onclick="modifierFilm(${film.id})" style="background: var(--success); margin-bottom: 5px;">
        <i class="fa-solid fa-edit"></i> Modifier
      </button>
      <button onclick="deleteFilm(${film.id})">
        <i class="fa-solid fa-trash"></i> Supprimer
      </button>
    `;
    filmsList.appendChild(card);
  });
}

function filterByGenre() {
  const genre = genreFilter.value;
  if (genre === '') {
    filteredFilms = [];
  } else {
    filteredFilms = films.filter(f => f.genre === genre);
  }
  renderFilms();
}

function searchFilms() {
  const query = searchInput.value.toLowerCase();
  if (query === '') {
    filteredFilms = [];
  } else {
    filteredFilms = films.filter(f => 
      f.title.toLowerCase().includes(query) ||
      f.genre.toLowerCase().includes(query) ||
      f.directorName.toLowerCase().includes(query)
    );
  } 
  renderFilms();
}

function resetFilters() {
  genreFilter.value = '';
  searchInput.value = '';
  filteredFilms = [];
  renderFilms();
}

function updateGenreFilter() {
  const genres = [...new Set(films.map(f => f.genre))];
  genreFilter.innerHTML = '<option value="">Tous les genres</option>' +
    genres.map(g => `<option value="${g}">${g}</option>`).join('');
}


// PAGE RÉALISATEURS 

function createOrGetDirector(directorName) {
  let director = directors.find(d => d.name.toLowerCase() === directorName.toLowerCase());
  if (!director) {
    director = {
      id: Date.now(),
      name: directorName
    };
    directors.push(director);
    saveData();
    renderDirectors();
    updateDirectorSelect();
  }
  
  return director.id;
}

function addDirector(e) {
  e.preventDefault();
  
  const name = directorNameInput.value.trim();
  
  if (!name) {
    alert('Entrez un nom!');
    return;
  }
  
  if (directors.find(d => d.name.toLowerCase() === name.toLowerCase())) {
    alert('Ce réalisateur existe déjà !');
    return;
  }
  
  const director = {
    id: Date.now(),
    name
  };
  
  directors.push(director);
  saveData();
  directorNameInput.value = '';
  renderDirectors();
  updateDirectorSelect();
  updateDashboard();
}

function deleteDirector(id) {
  const filmCount = films.filter(f => f.directorId === id).length;
  
  if (filmCount > 0) {
    alert(`Impossible! Ce réalisateur a ${filmCount} film(s).`);
    return;
  }
  
  if (confirm('Supprimer ce réalisateur?')) {
    const index = directors.findIndex(d => d.id === id);
    if (index > -1) {
      directors.splice(index, 1);
      saveData();
      renderDirectors();
      updateDirectorSelect();
      updateDashboard();
    }
  }
}

function renderDirectors() {
  directorsList.innerHTML = '';
  
  if (directors.length === 0) {
    directorsList.innerHTML = '<p style="color: var(--muted);">Aucun réalisateur</p>';
    return;
  }
  
  directors.forEach(dir => {
    const count = films.filter(f => f.directorId === dir.id).length;
    const card = document.createElement('div');
    card.className = 'director-card';
    card.innerHTML = `
      <div class="info">
        <h4>${dir.name}</h4>
        <p>${count} film(s)</p>
      </div>
      <button onclick="deleteDirector(${dir.id})"><i class="fa-solid fa-trash"></i></button>
    `;
    directorsList.appendChild(card);
  });
}

function updateDirectorSelect() {
  filmDirectorSelect.innerHTML = '<option value="">Sélectionner un réalisateur</option>' +
    directors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}


// MODAL BTN(+)

function openModal() {
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
  modalDirName.value = '';
}

function addDirFromModal() {
  const name = modalDirName.value.trim();
  
  if (!name) {
    alert('Entrez un nom!');
    return;
  }
  
  const directorId = createOrGetDirector(name);
  filmDirectorSelect.value = directorId;
  closeModal();
}


// PAGE DASHBOARD 

function updateDashboard() {
  updateKPI();
  updateLists();
  updateCharts();
}

function updateKPI() {
  totalFilmsEl.textContent = films.length;
  totalDirectorsEl.textContent = directors.length;
  
  const avgRating = films.length > 0 
    ? (films.reduce((sum, f) => sum + f.rating, 0) / films.length).toFixed(1)
    : '0.0';
  avgRatingEl.textContent = avgRating;
  
  const genreCount = {};
  films.forEach(f => {
    genreCount[f.genre] = (genreCount[f.genre] || 0) + 1;
  });
  const topGenre = Object.keys(genreCount).length > 0 
    ? Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b)
    : '-';
  topGenreEl.textContent = topGenre;
}

function updateLists() {
  const topFilms = films.sort((a, b) => b.rating - a.rating).slice(0, 5);
  topFilmsEl.innerHTML = topFilms.length > 0
    ? topFilms.map(f => `<li><span>${f.title}</span><span>${f.rating}</span></li>`).join('')
    : '<li style="color: var(--muted);">Aucun film</li>';
  
  const recommended = films.filter(f => f.rating >= 8.5).sort((a, b) => b.rating - a.rating);
  recommendationsEl.innerHTML = recommended.length > 0
    ? recommended.map(f => `<li><span>${f.title}</span><span>${f.rating}</span></li>`).join('')
    : '<li style="color: var(--muted);">Aucune</li>';
  
  updateGenreFilter();
}

// DASHBOARD - CHARTS

function updateCharts() {
  updateGenreChart();
  updateYearChart();
}

function updateGenreChart() {
  const genreData = {};
  films.forEach(f => {
    genreData[f.genre] = (genreData[f.genre] || 0) + 1;
  });
  
  const genreCtx = document.getElementById('genreChart')?.getContext('2d');
  if (genreCtx) {
    if (genreChart) genreChart.destroy();
    genreChart = new Chart(genreCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(genreData),
        datasets: [{
          data: Object.values(genreData),
          backgroundColor: ['#f5c518', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'],
          borderColor: '#1f1f1f',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#ffffff' } }
        }
      }
    });
  }
}

function updateYearChart() {
  const yearData = {};
  films.forEach(f => {
    yearData[f.year] = (yearData[f.year] || 0) + 1;
  });
  const years = Object.keys(yearData).sort();
  
  const yearCtx = document.getElementById('yearChart')?.getContext('2d');
  if (yearCtx) {
    if (yearChart) yearChart.destroy();
    yearChart = new Chart(yearCtx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Nombre de films',
          data: years.map(y => yearData[y]),
          backgroundColor: '#f5c518',
          borderColor: '#e2b616',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#b3b3b3' },
            grid: { color: '#333' }
          },
          x: {
            ticks: { color: '#b3b3b3' },
            grid: { color: '#333' }
          }
        },
        plugins: {
          legend: { labels: { color: '#ffffff' } }
        }
      }
    });
  }
}


// PAGE AJOUTER (ADD) - API OMDB

async function searchOmdb() {
  const query = apiInput.value.trim();
  
  if (!query) {
    alert('Entrez un titre!');
    return;
  }
  
  apiLoading.style.display = 'block';
  apiResult.innerHTML = '';
  
  try {
    const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=b6003d8a`);
    const data = await res.json();
    
    apiLoading.style.display = 'none';
    
    if (data.Search) {
      apiResult.innerHTML = data.Search.slice(0, 5)
        .map(m => `
          <div class="api-item" onclick="getMovieDetails('${m.imdbID}')">
            <strong>${m.Title}</strong> (${m.Year})
            <br><small>Cliquez pour importer</small>
          </div>
        `).join('');
    } else {
      apiResult.innerHTML = '<p>Aucun film trouvé</p>';
    }
  } catch (err) {
    apiLoading.style.display = 'none';
    apiResult.innerHTML = '<p>Erreur API</p>';
  }
}

async function getMovieDetails(imdbId) {
  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=b6003d8a`);
    const movie = await res.json();
    if (movie.Response === 'True') {
      const directorName = movie.Director.split(',')[0].trim();
      const directorId = createOrGetDirector(directorName);
      document.getElementById('filmTitle').value = movie.Title;
      document.getElementById('filmYear').value = movie.Year;
      document.getElementById('filmDuration').value = movie.Runtime.replace(' min', '');
      document.getElementById('filmDirector').value = directorId;
      document.getElementById('filmGenre').value = movie.Genre.split(',')[0].trim();
      document.getElementById('filmPoster').value = movie.Poster;
      document.getElementById('filmRating').value = parseFloat(movie.imdbRating) || 7;
      switchSection('add');
    }
  } catch (err) {
    alert('Erreur lors de la récupération');
  }
}

function saveData() {
  localStorage.setItem('films', JSON.stringify(films));
  localStorage.setItem('directors', JSON.stringify(directors));
}
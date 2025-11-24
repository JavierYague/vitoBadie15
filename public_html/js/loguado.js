/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/*document.addEventListener('DOMContentLoaded', () => {
  // Recuperar usuario logueado
  const raw = sessionStorage.getItem('loggedInUser');
  if (!raw) {
    // sin sesión -> a login
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(raw);  // { email, nombre, foto? }

  // Saludo + avatar
  const welcome = document.getElementById('welcome-msg');
  const photo   = document.getElementById('userPhoto');

  if (welcome) {
    welcome.textContent = `Bienvenid@, ${user.nombre || 'Usuario'}`;
  }

  if (photo) {
    // usa la foto guardada o un avatar por defecto
    photo.src = user.foto || 'images/avatar-default.png';
  }
  

  // Logout: limpia la sesión antes de ir al index
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (ev) => {
      ev.preventDefault();
      sessionStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });
  }
});*/

/* logueado.js */
document.addEventListener('DOMContentLoaded', () => {
  // --- Sesión ---
  const raw = sessionStorage.getItem('loggedInUser');
  if (!raw) {
    window.location.href = 'login.html';
    return;
  }
  const user = JSON.parse(raw); // { email, nombre, foto? }

  // --- Saludo + avatar ---
  const welcome = document.getElementById('welcome-msg');
  const photo   = document.getElementById('userPhoto');

  if (welcome) welcome.textContent = `Bienvenid@, ${user.nombre || 'Usuario'}`;
  if (photo)   photo.src = user.foto || 'images/avatar-default.png';

  // --- Logout ---
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (ev) => {
      ev.preventDefault();
      sessionStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    });
  }

  // --- Búsqueda: guardar filtros y navegar a resultados ---
  function getFilters() {
    const ciudad = document.getElementById('ciudad')?.value || '';
    const min = parseInt(document.getElementById('price-min')?.value || '0', 10);
    const max = parseInt(document.getElementById('price-max')?.value || '2000', 10);
    return { ciudad, min, max };
  }

  function goToResults() {
    const { ciudad, min, max } = getFilters();

    if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max) {
      alert('Revisa el rango de precios (mínimo ≤ máximo).');
      return;
    }
    // Guarda filtros en sessionStorage para que los lea resultados.js
    sessionStorage.setItem('searchFilters', JSON.stringify({ ciudad, min, max }));
    window.location.href = 'resultados.html';
  }

  // Wire: botón y submit del formulario
  const btnSearch = document.getElementById('btn-search-logueado');
  if (btnSearch) btnSearch.addEventListener('click', goToResults);

  const form = document.getElementById('search-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      goToResults();
    });
  }
});
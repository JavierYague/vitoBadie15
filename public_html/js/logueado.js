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
  // 1) Comprobar sesión
  const raw = sessionStorage.getItem('loggedInUser');
  if (!raw) {
    window.location.href = 'login.html';
    return;
  }

  let user;
  try { user = JSON.parse(raw); }
  catch { window.location.href = 'login.html'; return; }

  // 2) Saludo "Hola, {nombre}"
  const welcomeEl = document.getElementById('welcome-msg');
  const nombre = user?.nombre || (user?.email ? user.email.split('@')[0] : 'Usuario');
  if (welcomeEl) welcomeEl.textContent = `Hola, ${nombre}`;

  // 3) Avatar (o imagen por defecto)
  const photo = document.getElementById('userPhoto');
  if (photo) photo.src = user?.foto || 'images/avatar-default.png';

  // 4) Logout
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
  const fecha = document.getElementById('fecha-desde')?.value || '';
  return { ciudad, min, max, fecha };
}

function goToResults() {
  const { ciudad, min, max, fecha } = getFilters();

  if (!fecha) {
    alert('Selecciona una fecha.');
    return;
  }
  if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max) {
    alert('Revisa el rango de precios (mínimo ≤ máximo).');
    return;
  }

  // Guarda filtros (con fecha) para que los lea resultados.js
  sessionStorage.setItem('searchFilters', JSON.stringify({ ciudad, min, max, fecha }));
  window.location.href = 'resultados.html';
}

// Default: hoy en el date (opcional)
const fechaInput = document.getElementById('fecha-desde');
if (fechaInput && !fechaInput.value) {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  fechaInput.value = `${yyyy}-${mm}-${dd}`;
}


  const btnSearch = document.getElementById('btn-search-logueado');
  if (btnSearch) btnSearch.addEventListener('click', goToResults);

  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); goToResults(); });
});

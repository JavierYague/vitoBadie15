/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/*// resultados.js

async function ensureDB(){
  if (!window.db) window.db = await openDB(); // openDB viene de db.js
  return window.db;
}

function readFilters(){
  const raw = sessionStorage.getItem('searchFilters');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function fetchRooms({ ciudad, min, max }){
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  const byPrice = store.index('precio'); // Índice creado en db.js
  const range = IDBKeyRange.bound(min, max);

  return await new Promise((resolve, reject) => {
    const out = [];
    const req = byPrice.openCursor(range);
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (c){
        const r = c.value;
        if (!ciudad || r.direccion === ciudad) out.push(r);
        c.continue();
      } else resolve(out);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function render(rooms, filters){
  const box = document.getElementById('results');
  const label = document.getElementById('filters-label');

  if (label){
    const city = filters.ciudad || 'Cualquier ciudad';
    label.textContent = `Resultados — ${city} · ${filters.min}–${filters.max} €/mes`;
  }

  if (!rooms.length){
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1;">
      <div class="room-body">
        <h3 class="room-title">Sin resultados</h3>
        <p class="room-meta">No hay habitaciones con esos filtros. Prueba con otro rango de precios o ciudad.</p>
      </div>
    </div>`;
    return;
  }

  box.innerHTML = rooms.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const meta = r.descripcion ? r.descripcion
               : (r.email ? `Propietario: ${r.email}` : ''); 

    return `
      <article class="room-card">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${meta}</p>
        </div>
        <div class="room-actions">
          <button class="btn btn-primary" data-id="${r.idHabitacion}">Detalles</button>
          <button class="btn btn-ghost" data-email="${r.email || ''}">Contactar</button>
        </div>
      </article>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const filters = readFilters();
  if (!filters){
    // Sin filtros -> volvemos a la búsqueda
    window.location.href = 'logeado.html';
    return;
  }
  const rooms = await fetchRooms(filters).catch(err => {
    console.error(err);
    return [];
  });
  render(rooms, filters);
});
*/

// resultados.js

// js/resultados.js

async function ensureDB() {
  if (!window.db) window.db = await openDB(); // viene de db.js
  return window.db;
}

function readFilters() {
  try {
    const raw = sessionStorage.getItem('searchFilters');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// <-- NUEVO: obtener email del usuario logueado para excluir sus pisos
function getLoggedEmail() {
  try {
    const rawUser = sessionStorage.getItem('loggedInUser');
    if (!rawUser) return null;
    const u = JSON.parse(rawUser);
    return u?.email || null;
  } catch { return null; }
}

async function fetchRooms({ ciudad, min, max }) {
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  const byPrice = store.index('precio');
  const range = IDBKeyRange.bound(min, max);

  // email del propietario a excluir (si hay sesión)
  const excludeEmail = getLoggedEmail();

  return await new Promise((resolve, reject) => {
    const out = [];
    const req = byPrice.openCursor(range);
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (!c) return resolve(out);

      const r = c.value; // {direccion, precio, email, ...}

      // 1) filtra ciudad (si hay)
      const okCity = !ciudad || r.direccion === ciudad;

      // 2) EXCLUIR pisos del usuario logueado
      const notMine = !excludeEmail || r.email !== excludeEmail;

      if (okCity && notMine) out.push(r);
      c.continue();
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function render(rooms, filters) {
  const box = document.getElementById('results');
  const label = document.getElementById('filters-label');

  if (label) {
    const city = filters.ciudad || 'Cualquier ciudad';
    label.textContent = `Resultados — ${city} · ${filters.min}–${filters.max} €/mes`;
  }

  if (!rooms.length) {
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1;">
      <div class="room-body">
        <h3 class="room-title">Sin resultados</h3>
        <p class="room-meta">No hay habitaciones con esos filtros (o las tuyas fueron excluidas).</p>
      </div>
    </div>`;
    return;
  }

  box.innerHTML = rooms.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const meta = r.descripcion ? r.descripcion
               : (r.email ? `Propietario: ${r.email}` : '');

    return `
      <article class="room-card">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${meta}</p>
        </div>
        <div class="room-actions">
          <button class="btn btn-primary" data-id="${r.idHabitacion}">Detalles</button>
          <button class="btn btn-ghost" data-email="${r.email || ''}">Contactar</button>
        </div>
      </article>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const filters = readFilters();
  if (!filters) {
    window.location.href = 'logeado.html';
    return;
  }
  const rooms = await fetchRooms(filters).catch(err => {
    console.error(err);
    return [];
  });
  render(rooms, filters);
});

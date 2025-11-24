/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/*// js/resultadoSinLogin.js
async function ensureDB(){
  if (!window.db) window.db = await openDB(); // openDB de db.js
  return window.db;
}

function readFilters(){
  const raw = sessionStorage.getItem('searchFiltersPublic');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function fetchRooms({ ciudad, min, max }){
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');
  const byPrice = store.index('precio');
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
        <p class="room-meta">No hay habitaciones con esos filtros. Prueba otro rango o ciudad.</p>
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
          <a class="btn btn-primary" href="login.html">Contactar</a>
        </div>
      </article>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const filters = readFilters();
  if (!filters){
    window.location.href = 'index.html';
    return;
  }
  const rooms = await fetchRooms(filters).catch(err => {
    console.error(err);
    return [];
  });
  render(rooms, filters);
});
*/
function showError(msg){
  console.error(msg);
  const box = document.getElementById('error-box');
  if (box) box.textContent = String(msg);
}

async function ensureDB(){
  if (typeof openDB !== 'function') {
    throw new Error('openDB no está disponible. ¿Se cargó js/db.js antes?');
  }
  if (!window.db) window.db = await openDB();
  return window.db;
}

function readFilters(){
  const raw = sessionStorage.getItem('searchFiltersPublic');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function fetchRooms({ ciudad, min, max }){
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  let byPrice = null;
  try { byPrice = store.index('precio'); } catch {}

  if (byPrice) {
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
  } else {
    return await new Promise((resolve, reject) => {
      const out = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const c = e.target.result;
        if (c){
          const r = c.value;
          if (r.precio >= min && r.precio <= max && (!ciudad || r.direccion === ciudad)){
            out.push(r);
          }
          c.continue();
        } else resolve(out);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

function render(rooms, filters){
  const box = document.getElementById('results');
  const label = document.getElementById('filters-label');

  if (label){
    const city = filters.ciudad || 'Cualquier ciudad';
    label.textContent = `Resultados — ${city} · ${filters.min}–${filters.max} €/mes (${rooms.length})`;
  }

  if (!rooms.length){
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1;">
      <div class="room-body">
        <h3 class="room-title">Sin resultados</h3>
        <p class="room-meta">No hay habitaciones con esos filtros. Prueba otro rango o ciudad.</p>
      </div>
    </div>`;
    return;
  }

  box.innerHTML = rooms.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const meta = r.descripcion ? r.descripcion : (r.email ? `Propietario: ${r.email}` : '');

    return `
      <article class="room-card">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${meta}</p>
        </div>
        <div class="room-actions">
          <a class="btn btn-primary" href="login.html">Contactar</a>
        </div>
      </article>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const filters = readFilters();
    if (!filters) {
      showError('No hay filtros. Vuelve al inicio para realizar una búsqueda.');
      return;
    }
    const rooms = await fetchRooms(filters);
    render(rooms, filters);
  } catch (err) {
    showError(err);
  }
});



/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/*// js/resultados.js

async function ensureDB() {
  if (!window.db) window.db = await openDB(); // openDB viene de db.js
  return window.db;
}

function readFilters() {
  try { return JSON.parse(sessionStorage.getItem('searchFilters') || 'null'); }
  catch { return null; }
}

function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem('loggedInUser');
    if (!raw) return null;
    return JSON.parse(raw); // {email, nombre, foto?}
  } catch {
    return null;
  }
}
const getLoggedUserEmail = () => getLoggedUser()?.email || null;

// --- solicitudes del usuario (para deshabilitar btn si ya existe) ---
async function fetchMyRequestIds(email) {
  const db = await ensureDB();
  const tx = db.transaction(['solicitudes'], 'readonly');
  const idx = tx.objectStore('solicitudes').index('emailInquilinoPosible');

  return await new Promise((resolve) => {
    const ids = new Set();
    idx.openCursor(IDBKeyRange.only(email)).onsuccess = (e) => {
      const c = e.target.result;
      if (c) { ids.add(c.value.idHabi); c.continue(); }
      else resolve(ids);
    };
  });
}

async function fetchRooms({ ciudad, min, max, fecha }) {
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  const idxPrice = store.index('precio');
  const range = IDBKeyRange.bound(min, max);

  return await new Promise((resolve, reject) => {
    const out = [];
    const req = idxPrice.openCursor(range);
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        const r = c.value;
        const cityOK = !ciudad || r.direccion === ciudad;
        let dateOK = true;
        if (fecha) dateOK = !r.disponibleDesde || r.disponibleDesde <= fecha;

        if (cityOK && dateOK) out.push(r);
        c.continue();
      } else {
        out.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        resolve(out);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function render(rooms, filters, currentEmail, requestedIds = new Set()) {
  const box = document.getElementById('results');
  const label = document.getElementById('filters-label');

  if (label) {
    const city = filters.ciudad || 'Cualquier ciudad';
    const dateLabel = filters.fecha ? ` · desde ${filters.fecha}` : '';
    label.textContent = `Resultados — ${city} · ${filters.min}–${filters.max} €/mes${dateLabel}`;
  }

  const visible = currentEmail
    ? rooms.filter(r => (r.email || '').toLowerCase() !== currentEmail.toLowerCase())
    : rooms;

  if (!visible.length) {
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1;">
      <div class="room-body">
        <h3 class="room-title">Sin resultados</h3>
        <p class="room-meta">No hay habitaciones con esos filtros. Prueba con otra ciudad, fecha o rango de precios.</p>
      </div>
    </div>`;
    return;
  }

  box.innerHTML = visible.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const metaLines = [
      r.descripcion ? r.descripcion : null,
      r.disponibleDesde ? `Disponible desde: ${r.disponibleDesde}` : null,
      r.email ? `Propietario: ${r.email}` : null
    ].filter(Boolean).join(' · ');

    const yaSolicitada = requestedIds.has(r.idHabitacion);
    const solicitarBtn = `
      <button class="btn btn-primary btn-solicitar"
              data-id="${r.idHabitacion}"
              ${yaSolicitada ? 'disabled' : ''}>
        ${yaSolicitada ? 'Solicitada' : 'Solicitar'}
      </button>`;

    return `
      <article class="room-card">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${metaLines}</p>
        </div>
        <div class="room-actions">
          ${solicitarBtn}
          <button class="btn btn-ghost" data-email="${r.email || ''}">Contactar</button>
        </div>
      </article>
    `;
  }).join('');

  // Delegación de eventos para "Solicitar"
  box.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.btn-solicitar');
    if (!btn) return;

    const user = getLoggedUser();
    if (!user) { alert('Inicia sesión para solicitar.'); return; }

    const idHabi = Number(btn.dataset.id);
    if (requestedIds.has(idHabi)) return;

    try {
      const db = await ensureDB();

      // doble check: ¿ya existía?
      const yaExiste = await new Promise((resolve) => {
        const tx = db.transaction(['solicitudes'], 'readonly');
        const idx = tx.objectStore('solicitudes').index('emailInquilinoPosible');
        let existe = false;
        idx.openCursor(IDBKeyRange.only(user.email)).onsuccess = (e) => {
          const c = e.target.result;
          if (c) {
            if (c.value.idHabi === idHabi) { existe = true; resolve(true); }
            else c.continue();
          } else resolve(existe);
        };
      });
      if (yaExiste) { alert('Ya habías solicitado este piso.'); return; }

      // inserta solicitud
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['solicitudes'], 'readwrite');
        tx.objectStore('solicitudes').add({
          // idSolicitud autoincrement
          idHabi: idHabi,
          emailInquilinoPosible: user.email
        });
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
      });

      requestedIds.add(idHabi);
      btn.disabled = true;
      btn.textContent = 'Solicitada';
      alert('Solicitud enviada correctamente.');
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar la solicitud.');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const filters = readFilters();
  if (!filters) { window.location.href = 'logueado.html'; return; }

  const currentEmail = getLoggedUserEmail();

  const [rooms, requestedIds] = await Promise.all([
    fetchRooms(filters).catch(() => []),
    currentEmail ? fetchMyRequestIds(currentEmail) : Promise.resolve(new Set())
  ]);

  render(rooms, filters, currentEmail, requestedIds);
});
*/
// js/resultados.js

async function ensureDB() {
  if (!window.db) window.db = await openDB(); // openDB viene de db.js
  return window.db;
}

function readFilters() {
  try { return JSON.parse(sessionStorage.getItem('searchFilters') || 'null'); }
  catch { return null; }
}

function getLoggedUserEmail() {
  try {
    const raw = sessionStorage.getItem('loggedInUser');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.email || null;
  } catch { return null; }
}

/** Devuelve un Set con los idHabi que YA ha solicitado este email */
async function getRequestedIdsByUser(db, email) {
  if (!email) return new Set();
  const tx = db.transaction(['solicitudes'], 'readonly');
  const store = tx.objectStore('solicitudes');
  const idx = store.index('emailInquilinoPosible');

  return await new Promise((resolve, reject) => {
    const ids = new Set();
    const req = idx.openCursor(IDBKeyRange.only(email));
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        const row = c.value;
        // OJO: en la store el campo se llama idHabi (con H mayúscula)
        if (row?.idHabi != null) ids.add(row.idHabi);
        c.continue();
      } else resolve(ids);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function fetchRooms({ ciudad, min, max, fecha }) {
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  const idxPrice = store.index('precio');
  const range = IDBKeyRange.bound(min, max);

  return await new Promise((resolve, reject) => {
    const out = [];
    const req = idxPrice.openCursor(range);
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        const r = c.value;

        const cityOK = !ciudad || r.direccion === ciudad;

        let dateOK = true;
        if (fecha) {
          dateOK = r.disponibleDesde ? (r.disponibleDesde <= fecha) : true;
        }

        if (cityOK && dateOK) out.push(r);
        c.continue();
      } else {
        out.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        resolve(out);
      }
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function render(rooms, filters, currentEmail, requestedIds) {
  const box = document.getElementById('results');
  const label = document.getElementById('filters-label');

  if (label) {
    const city = filters.ciudad || 'Cualquier ciudad';
    const dateLabel = filters.fecha ? ` · desde ${filters.fecha}` : '';
    label.textContent = `Resultados — ${city} · ${filters.min}–${filters.max} €/mes${dateLabel}`;
  }

  // 1) Oculta pisos propios
  // 2) Oculta pisos ya solicitados por el usuario (requestedIds)
  const visible = rooms.filter((r) => {
    const isOwn = currentEmail && (r.email || '').toLowerCase() === currentEmail.toLowerCase();
    const alreadyRequested = requestedIds.has(r.idHabitacion);
    return !isOwn && !alreadyRequested;
  });

  if (!visible.length) {
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1;">
      <div class="room-body">
        <h3 class="room-title">Sin resultados</h3>
        <p class="room-meta">No hay habitaciones con esos filtros (o ya has solicitado todas las visibles).</p>
      </div>
    </div>`;
    return;
  }

  box.innerHTML = visible.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const metaLines = [
      r.descripcion ? r.descripcion : null,
      r.disponibleDesde ? `Disponible desde: ${r.disponibleDesde}` : null,
      r.email ? `Propietario: ${r.email}` : null
    ].filter(Boolean).join(' · ');

    return `
      <article class="room-card">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${metaLines}</p>
        </div>
        <div class="room-actions">
          
          <button class="btn btn-primary" data-solicitar="${r.idHabitacion}">Solicitar</button>
        </div>
      </article>
    `;
  }).join('');

  // Delegación para "Solicitar"
  box.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-solicitar]');
    if (!btn) return;

    const idHabi = Number(btn.getAttribute('data-solicitar'));
    if (!currentEmail) {
      alert('Debes iniciar sesión para solicitar.');
      return;
    }

    const db = await ensureDB();
    const tx = db.transaction(['solicitudes'], 'readwrite');
    const store = tx.objectStore('solicitudes');
    await new Promise((resolve, reject) => {
      const req = store.add({ idHabi, emailInquilinoPosible: currentEmail });
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });

    alert('Solicitud enviada.');
    // Quita la tarjeta tras solicitar
    const card = btn.closest('.room-card');
    if (card) card.remove();
  }, { once: false });
}

document.addEventListener('DOMContentLoaded', async () => {
  const filters = readFilters();
  if (!filters) { window.location.href = 'logueado.html'; return; }

  const currentEmail = getLoggedUserEmail();
  const db = await ensureDB();

  const [rooms, requestedIds] = await Promise.all([
    fetchRooms(filters).catch(() => []),
    getRequestedIdsByUser(db, currentEmail).catch(() => new Set())
  ]);

  render(rooms, filters, currentEmail, requestedIds);
});

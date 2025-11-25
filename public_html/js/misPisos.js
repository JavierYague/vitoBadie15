/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/misPisos.js
async function ensureDB(){ if(!window.db) window.db = await openDB(); return window.db; }

function getSessionUser(){
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); }
  catch { return null; }
}

async function fetchMyRooms(email){
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');
  const idx = store.index('email');

  return await new Promise((resolve) => {
    const out = [];
    idx.openCursor(IDBKeyRange.only(email)).onsuccess = (e) => {
      const c = e.target.result;
      if (c){ out.push(c.value); c.continue(); }
      else resolve(out.sort((a,b)=>(a.precio||0)-(b.precio||0)));
    };
  });
}

function render(rooms){
  const box = document.getElementById('my-rooms');
  if (!rooms.length){
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1">
      <div class="room-body"><h3 class="room-title">No tienes pisos publicados.</h3>
      <p class="room-meta">Pulsa “Subir piso” para crear tu primer anuncio.</p></div></div>`;
    return;
  }

  box.innerHTML = rooms.map(r => {
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio} €/mes`;
    const disp  = r.disponibleDesde ? `Disponible desde: ${r.disponibleDesde}` : '';
    return `
      <article class="room-card" data-id="${r.idHabitacion}">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">${disp}</p>
          ${r.descripcion ? `<p class="room-meta">${r.descripcion}</p>` : ''}
        </div>
        <div class="room-actions">
          <!-- Edición futura -->
          <button class="btn btn-ghost btn-delete">Eliminar</button>
        </div>
      </article>`;
  }).join('');

  // borrar
  box.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const card = ev.currentTarget.closest('.room-card');
      const id = Number(card.dataset.id);
      if (!confirm('¿Eliminar este piso?')) return;

      const db = await ensureDB();
      const tx = db.transaction(['habitaciones','solicitudes','alquileres'], 'readwrite');
      // 1) elimina la habitación
      tx.objectStore('habitaciones').delete(id);
      // 2) borra solicitudes ligadas a esa habitación
      const solIdx = tx.objectStore('solicitudes').index('idHabi');
      solIdx.openCursor(IDBKeyRange.only(id)).onsuccess = e => {
        const c = e.target.result; if (c){ tx.objectStore('solicitudes').delete(c.primaryKey); c.continue(); }
      };
      // 3) borra alquileres ligados a esa habitación
      const alkIdx = tx.objectStore('alquileres').index('idhabi');
      alkIdx.openCursor(IDBKeyRange.only(id)).onsuccess = e => {
        const c = e.target.result; if (c){ tx.objectStore('alquileres').delete(c.primaryKey); c.continue(); }
      };

      tx.oncomplete = async () => {
        const user = getSessionUser();
        const rooms = await fetchMyRooms(user.email);
        render(rooms);
      };
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = getSessionUser();
  if (!user){ window.location.href = 'login.html'; return; }
  const rooms = await fetchMyRooms(user.email);
  render(rooms);
});



/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/misSolicitudes.js
//este es para ver las solicitudes que yo he hecho
async function ensureDB(){ if(!window.db) window.db = await openDB(); return window.db; }

function getSessionUser(){
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); }
  catch { return null; }
}

async function fetchMyRequests(email){
  const db = await ensureDB();

  // 1) lee solicitudes del usuario
  const reqs = await new Promise((resolve) => {
    const out = [];
    const tx = db.transaction(['solicitudes'], 'readonly');
    const idx = tx.objectStore('solicitudes').index('emailInquilinoPosible');
    idx.openCursor(IDBKeyRange.only(email)).onsuccess = e => {
      const c = e.target.result; if (c){ out.push(c.value); c.continue(); } else resolve(out);
    };
  });

  if (!reqs.length) return [];

  // 2) trae datos de habitaciones asociadas
  const habTx = (await ensureDB()).transaction(['habitaciones'], 'readonly');
  const habStore = habTx.objectStore('habitaciones');

  const out = [];
  for (const s of reqs){
    const hab = await new Promise(res => {
      const r = habStore.get(s.idHabi);
      r.onsuccess = () => res(r.result || null);
      r.onerror   = () => res(null);
    });
    out.push({ solicitud: s, habitacion: hab });
  }
  return out;
}

function render(items){
  const box = document.getElementById('my-requests');
  if (!items.length){
    box.innerHTML = `<div class="room-card" style="grid-column:1/-1">
      <div class="room-body"><h3 class="room-title">No tienes solicitudes enviadas.</h3></div></div>`;
    return;
  }

  box.innerHTML = items.map(({solicitud, habitacion}) => {
    const r = habitacion || {};
    const img = r.imagen || 'images/hab/placeholder.jpg';
    const title = `${r.direccion || '—'} · ${r.precio ? r.precio + ' €/mes' : ''}`;
    return `
      <article class="room-card" data-id="${solicitud.idSolicitud}">
        <img class="room-img" src="${img}" alt="Habitación en ${r.direccion || ''}">
        <div class="room-body">
          <h3 class="room-title">${title}</h3>
          <p class="room-meta">Solicitud a la habitación #${solicitud.idHabi}</p>
        </div>
        <div class="room-actions">
          <button class="btn btn-ghost btn-cancel">Cancelar</button>
        </div>
      </article>`;
  }).join('');

  // cancelar solicitud
  box.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const card = ev.currentTarget.closest('.room-card');
      const id = Number(card.dataset.id);
      if (!confirm('¿Cancelar esta solicitud?')) return;

      const db = await ensureDB();
      const tx = db.transaction(['solicitudes'], 'readwrite');
      tx.objectStore('solicitudes').delete(id);
      tx.oncomplete = async () => {
        const user = getSessionUser();
        const items = await fetchMyRequests(user.email);
        render(items);
      };
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = getSessionUser();
  if (!user){ window.location.href = 'login.html'; return; }
  const items = await fetchMyRequests(user.email);
  render(items);
});



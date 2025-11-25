/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
//este es para ver las solicitudes que me han hecho para decidir si aceptarlas
// js/verSolicitudes.js
// js/verMisSolicitudes.js
async function ensureDB() {
  if (!window.db) window.db = await openDB();
  return window.db;
}

function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem('loggedInUser');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function getMyRooms(email) {
  const db = await ensureDB();
  const tx = db.transaction(['habitaciones'], 'readonly');
  const store = tx.objectStore('habitaciones');

  // si tienes índice por email, úsalo; si no, filtra a mano
  let rooms = [];
  try {
    const idx = store.index('email');
    rooms = await new Promise((resolve, reject) => {
      const req = idx.getAll(email);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    rooms = await new Promise((resolve, reject) => {
      const out = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
          if ((c.value.email || '').toLowerCase() === email.toLowerCase()) out.push(c.value);
          c.continue();
        } else resolve(out);
      };
      req.onerror = () => reject(req.error);
    });
  }
  return rooms.sort((a,b)=>(a.precio||0)-(b.precio||0));
}

async function getIncomingRequestsForOwner(ownerEmail) {
  const db = await ensureDB();
  const tx = db.transaction(['solicitudes','habitaciones'], 'readonly');
  const solStore = tx.objectStore('solicitudes');
  const habStore = tx.objectStore('habitaciones');

  return await new Promise((resolve, reject) => {
    const out = [];
    solStore.openCursor().onsuccess = async (e) => {
      const c = e.target.result;
      if (!c) { resolve(out); return; }
      const sol = c.value; // {idSolicitud, idHabi, emailInquilinoPosible, ...}

      const habReq = habStore.get(sol.idHabi);
      habReq.onsuccess = () => {
        const hab = habReq.result;
        if (hab && (hab.email || '').toLowerCase() === ownerEmail.toLowerCase()) {
          out.push({
            idSolicitud: c.primaryKey,
            idHabi: sol.idHabi,
            solicitante: sol.emailInquilinoPosible,
            estado: sol.estado || 'pendiente',
            habCiudad: hab.direccion || '—',
            habPrecio: hab.precio || 0
          });
        }
        c.continue();
      };
      habReq.onerror = () => { /* ignoramos y seguimos */ c.continue(); };
    };
  });
}

function renderMyRooms(rooms) {
  const box = document.getElementById('mis-pisos');
  if (!box) return;

  if (!rooms.length) {
    box.innerHTML = `<p>No tienes pisos publicados todavía.</p>`;
    return;
  }
  box.innerHTML = rooms.map(r => `
    <article class="room-card">
      <img class="room-img" src="${r.imagen || 'images/hab/placeholder.jpg'}" alt="">
      <div class="room-body">
        <h3 class="room-title">${r.direccion || '—'} · ${r.precio} €/mes</h3>
        <p class="room-meta">
          ID: ${r.idHabitacion} · Propietario: ${r.email}<br>
          ${r.disponibleDesde ? 'Disponible desde: '+r.disponibleDesde : ''}
        </p>
      </div>
    </article>
  `).join('');
}

function renderRequests(requests) {
  const body = document.getElementById('solicitudes-body');
  if (!body) return;

  if (!requests.length) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay solicitudes para tus pisos</td></tr>`;
    return;
  }
  body.innerHTML = requests.map(r => `
    <tr data-ids="${r.idSolicitud}" data-idh="${r.idHabi}">
      <td>${r.idHabi}</td>
      <td>${r.habCiudad}</td>
      <td>${r.habPrecio} €</td>
      <td>${r.solicitante}</td>
      <td>${r.estado}</td>
      <td>
        <button class="btn-accept">Aceptar</button>
        <button class="btn-reject">Rechazar</button>
      </td>
    </tr>
  `).join('');
}

async function acceptRequest(idSolicitud, idHabi, solicitanteEmail) {
  const db = await ensureDB();
  const nowIso = new Date().toISOString();

  const tx = db.transaction(['alquileres','solicitudes'], 'readwrite');
  const alkStore = tx.objectStore('alquileres');
  const solStore = tx.objectStore('solicitudes');

  // Crea alquiler (inicio hoy; fin null)
  alkStore.add({
    idhabi: idHabi,
    emailInquilino: solicitanteEmail,
    finicioAlquiler: nowIso,
    fFinAlquiler: null
  });

  // Borra solicitud
  solStore.delete(Number(idSolicitud));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function rejectRequest(idSolicitud) {
  const db = await ensureDB();
  const tx = db.transaction(['solicitudes'], 'readwrite');
  tx.objectStore('solicitudes').delete(Number(idSolicitud));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function refresh() {
  const user = getLoggedUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const email = (user.email || '').toLowerCase();

  const [rooms, reqs] = await Promise.all([
    getMyRooms(email),
    getIncomingRequestsForOwner(email),
  ]);

  renderMyRooms(rooms);
  renderRequests(reqs);
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureDB();

  // Cargar inicial
  refresh().catch(console.error);

  // Botón actualizar
  const btn = document.getElementById('btn-refresh');
  if (btn) btn.addEventListener('click', () => refresh());

  // Delegación de eventos Aceptar/Rechazar
  const tbody = document.getElementById('solicitudes-body');
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr[data-ids]');
      if (!tr) return;

      const idSolicitud = tr.getAttribute('data-ids');
      const idHabi = Number(tr.getAttribute('data-idh'));
      const solicitanteEmail = tr.querySelector('td:nth-child(4)')?.textContent?.trim();

      if (e.target.classList.contains('btn-accept')) {
        try {
          await acceptRequest(idSolicitud, idHabi, solicitanteEmail);
          alert('Solicitud aceptada. Se ha creado el alquiler.');
          refresh();
        } catch (err) {
          console.error(err);
          alert('No se ha podido aceptar la solicitud.');
        }
      } else if (e.target.classList.contains('btn-reject')) {
        try {
          await rejectRequest(idSolicitud);
          alert('Solicitud rechazada.');
          refresh();
        } catch (err) {
          console.error(err);
          alert('No se ha podido rechazar la solicitud.');
        }
      }
    });
  }
});

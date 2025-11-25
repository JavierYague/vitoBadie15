/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/verMisAlquileres.js

async function ensureDB(){ if(!window.db) window.db = await openDB(); return window.db; }

function getLoggedUser(){
  try { return JSON.parse(sessionStorage.getItem('loggedInUser')||'null'); }
  catch { return null; }
}

function fmtDate(iso){
  if(!iso) return '—';
  try {
    const d = new Date(iso);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  } catch { return iso; }
}
function todayISO(){
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}T00:00:00.000Z`;
}
function plusMonthsISO(iso, months){
  const d = new Date(iso || todayISO());
  d.setMonth(d.getMonth() + (months||0));
  return d.toISOString();
}

/* ---- Carga de datos ---- */
async function fetchAlquileresComoInquilino(email){
  const db = await ensureDB();
  const tx = db.transaction(['alquileres','habitaciones'], 'readonly');
  const alqStore = tx.objectStore('alquileres');
  const habStore = tx.objectStore('habitaciones');

  const res = [];
  await new Promise((resolve,reject)=>{
    const req = alqStore.index('emailInquilino').openCursor(IDBKeyRange.only(email));
    req.onsuccess = e=>{
      const c = e.target.result;
      if(!c) return resolve();
      const alq = c.value; // {idContrato, idhabi, emailInquilino, finicioAlquiler, fFinAlquiler}
      const getHab = habStore.get(alq.idhabi);
      getHab.onsuccess = ()=>{
        const hab = getHab.result || {};
        res.push({ alq, hab });
        c.continue();
      };
      getHab.onerror = ()=>{ res.push({ alq, hab:{} }); c.continue(); };
    };
    req.onerror = e=>reject(e.target.error);
  });
  return res;
}

async function fetchAlquileresComoPropietario(emailProp){
  const db = await ensureDB();
  // 1) Traer mis habitaciones
  const misHabitaciones = await new Promise((resolve, reject)=>{
    const out = [];
    const tx = db.transaction(['habitaciones'], 'readonly');
    const idx = tx.objectStore('habitaciones').index('email');
    const req = idx.openCursor(IDBKeyRange.only(emailProp));
    req.onsuccess = e=>{
      const c = e.target.result;
      if(!c) return resolve(out);
      out.push(c.value); // cada hab
      c.continue();
    };
    req.onerror = e=>reject(e.target.error);
  });

  const ids = new Set(misHabitaciones.map(h=>h.idHabitacion));

  // 2) Traer alquileres cuya idhabi ∈ mis habitaciones
  const res = [];
  await new Promise((resolve,reject)=>{
    const tx = db.transaction(['alquileres'], 'readonly');
    const req = tx.objectStore('alquileres').openCursor();
    req.onsuccess = e=>{
      const c = e.target.result;
      if(!c) return resolve();
      const alq = c.value;
      if(ids.has(alq.idhabi)){
        const hab = misHabitaciones.find(h=>h.idHabitacion===alq.idhabi) || {};
        res.push({ alq, hab });
      }
      c.continue();
    };
    req.onerror = e=>reject(e.target.error);
  });

  return res;
}

/* ---- Render ---- */
function renderTablaInquilino(rows){
  const tb = document.getElementById('tbody-inquilino');
  const empty = document.getElementById('empty-inquilino');
  if(!rows.length){
    tb.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  tb.innerHTML = rows.map(({alq, hab})=>`
    <tr data-id="${alq.idContrato}">
      <td>${alq.idContrato}</td>
      <td>${alq.idhabi}</td>
      <td>${hab.direccion || '—'}</td>
      <td>${hab.precio != null ? hab.precio + ' €' : '—'}</td>
      <td>${fmtDate(alq.finicioAlquiler)}</td>
      <td>${fmtDate(alq.fFinAlquiler)}</td>
      <td class="rs-actions-col">
        <button class="btn btn-ghost" data-action="renovar" data-id="${alq.idContrato}">Renovar +6m</button>
        <button class="btn btn-danger" data-action="finalizar" data-id="${alq.idContrato}">Finalizar</button>
      </td>
    </tr>
  `).join('');
}

function renderTablaPropietario(rows){
  const tb = document.getElementById('tbody-propietario');
  const empty = document.getElementById('empty-propietario');
  if(!rows.length){
    tb.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  tb.innerHTML = rows.map(({alq, hab})=>`
    <tr data-id="${alq.idContrato}">
      <td>${alq.idContrato}</td>
      <td>${alq.idhabi}</td>
      <td>${hab.direccion || '—'}</td>
      <td>${hab.precio != null ? hab.precio + ' €' : '—'}</td>
      <td>${alq.emailInquilino || '—'}</td>
      <td>${fmtDate(alq.finicioAlquiler)}</td>
      <td>${fmtDate(alq.fFinAlquiler)}</td>
      <td class="rs-actions-col">
        <button class="btn btn-ghost" data-action="renovar" data-id="${alq.idContrato}">Renovar +6m</button>
        <button class="btn btn-danger" data-action="finalizar" data-id="${alq.idContrato}">Finalizar</button>
      </td>
    </tr>
  `).join('');
}

/* ---- Acciones: renovar / finalizar ---- */
async function updateContrato(idContrato, updater){
  const db = await ensureDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(['alquileres'], 'readwrite');
    const store = tx.objectStore('alquileres');
    const get = store.get(Number(idContrato));
    get.onsuccess = ()=>{
      const row = get.result;
      if(!row) return reject(new Error('Contrato no encontrado'));
      const updated = updater({...row});
      store.put(updated);
    };
    get.onerror = e=>reject(e.target.error);
    tx.oncomplete = ()=>resolve(true);
    tx.onerror = e=>reject(e.target.error);
  });
}

async function onActionClick(e){
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if(action === 'finalizar'){
    if(!confirm('¿Finalizar este alquiler desde hoy?')) return;
    await updateContrato(id, row=>{ row.fFinAlquiler = todayISO(); return row; });
  }else if(action === 'renovar'){
    await updateContrato(id, row=>{
      const base = row.fFinAlquiler && new Date(row.fFinAlquiler) > new Date() ? row.fFinAlquiler : todayISO();
      row.fFinAlquiler = plusMonthsISO(base, 6);
      return row;
    });
  }
  await loadAndRender(); // refrescar tablas
}

/* ---- Bootstrap ---- */
async function loadAndRender(){
  const user = getLoggedUser();
  if(!user){ window.location.href = 'login.html'; return; }
  const email = user.email;

  const [comoInq, comoProp] = await Promise.all([
    fetchAlquileresComoInquilino(email),
    fetchAlquileresComoPropietario(email),
  ]);

  renderTablaInquilino(comoInq);
  renderTablaPropietario(comoProp);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const user = getLoggedUser();
  if(!user){ window.location.href = 'login.html'; return; }

  await ensureDB();
  await loadAndRender();

  document.getElementById('tbody-inquilino').addEventListener('click', onActionClick);
  document.getElementById('tbody-propietario').addEventListener('click', onActionClick);
  document.getElementById('btn-refresh')?.addEventListener('click', loadAndRender);
});



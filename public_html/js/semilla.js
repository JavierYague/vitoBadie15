/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/* ===== RoomMatch – seed.js (datos ficticios) ===== */
/* Requiere que ya tengas incluido db.js y ejecutado openDB() antes de llamar a estas funciones. */

/** Borra todos los datos de todas las stores */
function wipeAll() {
  return new Promise((resolve, reject) => {
    const t = db.transaction(['usuarios','habitaciones','solicitudes','alquileres'], 'readwrite');
    t.objectStore('usuarios').clear();
    t.objectStore('habitaciones').clear();
    t.objectStore('solicitudes').clear();
    t.objectStore('alquileres').clear();

    t.oncomplete = () => resolve(true);
    t.onerror    = (e) => reject(e.target.error);
    t.onabort    = (e) => reject(e.target.error);
  });
}

/** Inserta múltiples registros en una store */
function addMany(storeName, rows) {
  return new Promise((resolve, reject) => {
    const t = db.transaction([storeName], 'readwrite');
    const store = t.objectStore(storeName);
    rows.forEach(r => store.add(r));
    t.oncomplete = () => resolve(true);
    t.onerror    = (e) => reject(e.target.error);
  });
}

/** Comprueba si ya hay datos (habitaciones) */
function hasData() {
  return new Promise((resolve, reject) => {
    const t = db.transaction(['habitaciones'], 'readonly');
    const store = t.objectStore('habitaciones');
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result > 0);
    countReq.onerror   = (e) => reject(e.target.error);
  });
}

/** Crea datos ficticios (sin borrar nada) */
async function seedRoomMatch() {
  // Si ya hay datos, no hacemos nada
  if (await hasData()) { 
    console.log('Seed: ya existen habitaciones, no se crean datos de ejemplo.');
    return false;
  }

  // --- Usuarios (propietarios + posibles inquilinos) ---
  const usuarios = [
    { email:'ana@rm.com',   password:'1234', nombre:'Ana',   foto:'images/usuarios/ana.jpg' },
    { email:'jose@rm.com',  password:'1234', nombre:'Jose',  foto:'images/usuarios/jose.jpg' },
    { email:'maria@rm.com', password:'1234', nombre:'María', foto:'images/usuarios/maria.jpg' },
    { email:'iker@rm.com',  password:'1234', nombre:'Iker',  foto:'images/usuarios/iker.jpg' },
    { email:'nora@rm.com',  password:'1234', nombre:'Nora',  foto:'images/usuarios/nora.jpg' },
    { email:'luis@rm.com',  password:'1234', nombre:'Luis',  foto:'images/usuarios/luis.jpg' },
    { email:'julen@rm.com', password:'1234', nombre:'Julen', foto:'images/usuarios/julen.jpg' },
    { email:'laura@rm.com', password:'1234', nombre:'Laura', foto:'images/usuarios/laura.jpg' },
  ];
  await addMany('usuarios', usuarios);

  // --- Habitaciones ---
  // OJO: idHabitacion es autoincrement => no lo ponemos (lo genera IndexedDB)
  const nowISO = () => new Date().toISOString();
  const habitaciones = [
    // VITORIA
    { direccion:'Vitoria', lat:42.846, longi:-2.671, precio:300, imagen:'images/hab/vit1.jpg', email:'ana@rm.com',   creadaEn: nowISO() },
    { direccion:'Vitoria', lat:42.842, longi:-2.675, precio:450, imagen:'images/hab/vit2.jpg', email:'jose@rm.com',  creadaEn: nowISO() },
    { direccion:'Vitoria', lat:42.839, longi:-2.676, precio:650, imagen:'images/hab/vit3.jpg', email:'maria@rm.com', creadaEn: nowISO() },
    // BILBAO
    { direccion:'Bilbao',  lat:43.262, longi:-2.935, precio:500, imagen:'images/hab/bil1.jpg', email:'ana@rm.com',   creadaEn: nowISO() },
    { direccion:'Bilbao',  lat:43.257, longi:-2.923, precio:720, imagen:'images/hab/bil2.jpg', email:'jose@rm.com',  creadaEn: nowISO() },
    { direccion:'Bilbao',  lat:43.267, longi:-2.936, precio:900, imagen:'images/hab/bil3.jpg', email:'maria@rm.com', creadaEn: nowISO() },
    // DONOSTI
    { direccion:'Donosti', lat:43.318, longi:-1.981, precio:550, imagen:'images/hab/dss1.jpg', email:'ana@rm.com',   creadaEn: nowISO() },
    { direccion:'Donosti', lat:43.309, longi:-2.005, precio:780, imagen:'images/hab/dss2.jpg', email:'jose@rm.com',  creadaEn: nowISO() },
    { direccion:'Donosti', lat:43.307, longi:-1.977, precio:950, imagen:'images/hab/dss3.jpg', email:'maria@rm.com', creadaEn: nowISO() },
    // Extra
    { direccion:'Vitoria', lat:42.849, longi:-2.668, precio:395, imagen:'images/hab/vit4.jpg', email:'ana@rm.com',   creadaEn: nowISO() },
  ];

  // Necesitamos conocer los idHabitacion generados para Solicitudes/Alquileres
  const idsHabitaciones = await new Promise((resolve, reject) => {
    const t = db.transaction(['habitaciones'], 'readwrite');
    const store = t.objectStore('habitaciones');
    const ids = [];
    habitaciones.forEach(h => {
      const r = store.add(h);
      r.onsuccess = () => ids.push(r.result);
      r.onerror   = (e) => reject(e.target.error);
    });
    t.oncomplete = () => resolve(ids);
    t.onerror    = (e) => reject(e.target.error);
  });

  // Mapa rápido por ciudad para componer solicitudes/alquileres
  const byCity = (city) => idsHabitaciones
    .map((id, i) => ({ id, data: habitaciones[i] }))
    .filter(x => x.data.direccion === city)
    .map(x => x.id);

  const habVit = byCity('Vitoria');
  const habBil = byCity('Bilbao');
  const habDss = byCity('Donosti');

  // --- Solicitudes (idSolicitud autoincrement) ---
  // Estructura: { idHabi, emailInquilinoPosible }
  const solicitudes = [
    { idHabi: habVit[0], emailInquilinoPosible: 'luis@rm.com' },
    { idHabi: habVit[2], emailInquilinoPosible: 'nora@rm.com' },
    { idHabi: habBil[1], emailInquilinoPosible: 'julen@rm.com' },
    { idHabi: habDss[0], emailInquilinoPosible: 'laura@rm.com' },
  ];
  await addMany('solicitudes', solicitudes);

  // --- Alquileres (idContrato autoincrement) ---
  // Estructura: { idhabi, emailInquilino, finicioAlquiler, fFinAlquiler }
  const hoy = new Date();
  const addDays = (d) => {
    const x = new Date(hoy); x.setDate(x.getDate() + d); return x.toISOString();
  };

  const alquileres = [
    { idhabi: habBil[0], emailInquilino: 'luis@rm.com',  finicioAlquiler: addDays(-30), fFinAlquiler: addDays(335) },
    { idhabi: habDss[1], emailInquilino: 'nora@rm.com',  finicioAlquiler: addDays(-10), fFinAlquiler: addDays(355) },
    { idhabi: habVit[1], emailInquilino: 'julen@rm.com', finicioAlquiler: addDays(-60), fFinAlquiler: addDays(305) },
  ];
  await addMany('alquileres', alquileres);

  console.log('Seed RoomMatch: usuarios, habitaciones, solicitudes y alquileres creados.');
  return true;
}

/** Atajo: borra y vuelve a sembrar desde cero */
async function wipeAndSeed() {
  await wipeAll();
  await seedRoomMatch();
}

/* Exponer helpers para usarlos desde consola o otros scripts */
window.seedRoomMatch = seedRoomMatch;
window.wipeAndSeed   = wipeAndSeed;
window.wipeAll       = wipeAll;



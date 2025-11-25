/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/* ===== RoomMatch – seed.js (datos ficticios) ===== */
/* Requiere tener cargado db.js y usar openDB() antes de llamar a estas funciones. */

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

/* Helpers de fechas */
const todayISO = () => (new Date()).toISOString();
const fmt = (d) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; // YYYY-MM-DD
};
const addDaysDate = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return d; };
const addDaysISOdate = (days) => fmt(addDaysDate(days)); // para disponibleDesde (string)

/** Crea datos ficticios (sin borrar nada) */
async function seedRoomMatch() {
  // Si ya hay datos, no hacemos nada
  if (await hasData()) {
    console.log('Seed: ya existen habitaciones, no se crean datos de ejemplo.');
    return false;
  }

  // --- Usuarios ---
  const usuarios = [
    { email:'admin@rm.com', password:'admin', nombre:'Admin' ,foto: 'images/admin.jpg' },
    { email:'adri@rm.com',   password:'1234', nombre:'Adriana',   foto:'images/mujer.png' },
    { email:'jose@rm.com',  password:'1234', nombre:'Jose',  foto:'images/hombre.png' },
    { email:'maria@rm.com', password:'1234', nombre:'María', foto:'images/mujer.pnj' },
    { email:'nerea@rm.com',  password:'1234', nombre:'Nerea',  foto:'images/mujer.pnj' },
    { email:'brandon@rm.com',  password:'cosmere', nombre:'Brandon',  foto:'images/sanderson.jpg' },
    { email:'borja@rm.com',  password:'1234', nombre:'borja',  foto:'images/borja.pnj' },
    { email:'javier@rm.com', password:'1234', nombre:'Javier', foto:'images/hombre.pnj' },
    { email:'martin@rm.com', password:'1234', nombre:'Martin', foto:'images/martin.pnj' },
  ];
  await addMany('usuarios', usuarios);

  // --- Habitaciones ---
  // idHabitacion autoincrement => no se pone
  const habitaciones = [
    // VITORIA
    { direccion:'Vitoria', lat:42.846, longi:-2.671, precio:300, imagen:'habitacionBarata.webp', email:'adri@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(0) },   // hoy
    { direccion:'Vitoria', lat:42.842, longi:-2.675, precio:450, imagen:'images/habitacionCreativa.jpg', email:'jose@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(5) },   // +5 días
    { direccion:'Vitoria', lat:42.839, longi:-2.676, precio:650, imagen:'images/habitacionDonosti.jpg', email:'maria@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(12) },  // +12 días

    // BILBAO
    { direccion:'Bilbao',  lat:43.262, longi:-2.935, precio:500, imagen:'images/images/habitacion1.jpg ', email:'adri@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(0) },   // hoy
    { direccion:'Bilbao',  lat:43.257, longi:-2.923, precio:720, imagen:'images/habitacionBilbao.webp', email:'jose@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(20) },  // +20 días
    { direccion:'Bilbao',  lat:43.267, longi:-2.936, precio:900, imagen:'images/habitacionLujo.jpg', email:'maria@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(1) },   // mañana

    // DONOSTI
    { direccion:'Donosti', lat:43.318, longi:-1.981, precio:550, imagen:'images/habitacionRupestre.jpg', email:'adri@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(7) },   // +7 días
    { direccion:'Donosti', lat:43.309, longi:-2.005, precio:780, imagen:'images/Donosti.jpg', email:'jose@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(0) },   // hoy
    { direccion:'Donosti', lat:43.307, longi:-1.977, precio:950, imagen:'images/habitacionOscura.jpg', email:'maria@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(30) },  // +30 días

    // Extra
    { direccion:'Vitoria', lat:42.849, longi:-2.668, precio:395, imagen:'images/atico.jpg', email:'adri@rm.com',
      creadaEn: todayISO(), disponibleDesde: addDaysISOdate(3) },   // +3 días
  ];

  // Guardar habitaciones y recuperar sus IDs autogenerados
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

  // Mapa rápido por ciudad
  const byCity = (city) => idsHabitaciones
    .map((id, i) => ({ id, data: habitaciones[i] }))
    .filter(x => x.data.direccion === city)
    .map(x => x.id);

  const habVit = byCity('Vitoria');
  const habBil = byCity('Bilbao');
  const habDss = byCity('Donosti');

  // --- Solicitudes ---
  const solicitudes = [
    { idHabi: habVit[0], emailInquilinoPosible: 'luis@rm.com' },
    { idHabi: habVit[2], emailInquilinoPosible: 'nora@rm.com' },
    { idHabi: habBil[1], emailInquilinoPosible: 'julen@rm.com' },
    { idHabi: habDss[0], emailInquilinoPosible: 'laura@rm.com' },
  ];
  await addMany('solicitudes', solicitudes);

  // --- Alquileres ---
  const hoy = new Date();
  const addDaysISO = (d) => { const x = new Date(hoy); x.setDate(x.getDate()+d); return x.toISOString(); };

  const alquileres = [
    { idhabi: habBil[0], emailInquilino: 'luis@rm.com',  finicioAlquiler: addDaysISO(-30), fFinAlquiler: addDaysISO(335) },
    { idhabi: habDss[1], emailInquilino: 'nora@rm.com',  finicioAlquiler: addDaysISO(-10), fFinAlquiler: addDaysISO(355) },
    { idhabi: habVit[1], emailInquilino: 'julen@rm.com', finicioAlquiler: addDaysISO(-60), fFinAlquiler: addDaysISO(305) },
  ];
  await addMany('alquileres', alquileres);

  console.log('Seed RoomMatch: usuarios, habitaciones (con disponibleDesde), solicitudes y alquileres creados.');
  return true;
}

/** Atajo: borra y vuelve a sembrar desde cero */
async function wipeAndSeed() {
  await wipeAll();
  await seedRoomMatch();
}

/* Exponer helpers */
window.seedRoomMatch = seedRoomMatch;
window.wipeAndSeed   = wipeAndSeed;
window.wipeAll       = wipeAll;

/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/* ===== RoomMatch - db.js (apertura/estructura) ===== */
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('roommatch', 1);

    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);

    req.onupgradeneeded = e => {
      db = e.target.result;
      //AQUI VAMOS A ESTRUCTURAR LA BASE DE DATOS COMO TAL

      // === Usuarios ===
      // PK: email
      // Campos: email, password, nombre, foto (base64|URL)
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'email' });
      }

      // === Habitaciones ===
      // PK: idHabitacion (autoIncrement)
      // Campos: idHabitacion, direccion(ciudad), lat(number), longi(number),
      //         precio(number), imagen(base64|URL), email(FK usuarios.email)
      // Índices: por ciudad(direccion), por precio, por email(propietario)
      if (!db.objectStoreNames.contains('habitaciones')) {
        const hab = db.createObjectStore('habitaciones', {
          keyPath: 'idHabitacion',
          autoIncrement: true
        });
        hab.createIndex('direccion', 'direccion', { unique: false });
        hab.createIndex('precio', 'precio', { unique: false });
        hab.createIndex('email', 'email', { unique: false });
      }

      // === Alquileres ===
      // PK: idContrato (autoIncrement)
      // Campos: idContrato, idhabi(FK habitaciones.idHabitacion),
      //         emailInquilino(FK usuarios.email),
      //         finicioAlquiler(ISO string), fFinAlquiler(ISO string)
      // Índices: por emailInquilino, por idhabi
      if (!db.objectStoreNames.contains('alquileres')) {
        const alk = db.createObjectStore('alquileres', {
          keyPath: 'idContrato',
          autoIncrement: true
        });
        alk.createIndex('emailInquilino', 'emailInquilino', { unique: false });
        alk.createIndex('idhabi', 'idhabi', { unique: false });
      }

      // === Solicitudes ===
      // PK: idSolicitud (autoIncrement)
      // Campos: idSolicitud, idHabi(FK habitaciones.idHabitacion),
      //         emailInquilinoPosible(FK usuarios.email)
      // Índices: por idHabi, por emailInquilinoPosible
      if (!db.objectStoreNames.contains('solicitudes')) {
        const sol = db.createObjectStore('solicitudes', {
          keyPath: 'idSolicitud',
          autoIncrement: true
        });
        sol.createIndex('idHabi', 'idHabi', { unique: false });
        sol.createIndex('emailInquilinoPosible', 'emailInquilinoPosible', { unique: false });
      }
    };
  });
}
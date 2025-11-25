/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

// db.js
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    // ⬅️ SUBIMOS VERSIÓN: de 1 a 2
    const req = indexedDB.open('roommatch', 2);

    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);

    req.onupgradeneeded = e => {
      db = e.target.result;

      // === Usuarios ===
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'email' });
      }

      // === Habitaciones ===
      // Campos mínimos: idHabitacion, direccion (ciudad), lat, longi, precio,
      // imagen, email (propietario), disponibleDesde (YYYY-MM-DD)
      if (!db.objectStoreNames.contains('habitaciones')) {
        const hab = db.createObjectStore('habitaciones', {
          keyPath: 'idHabitacion',
          autoIncrement: true
        });
        hab.createIndex('direccion', 'direccion', { unique: false });
        hab.createIndex('precio', 'precio', { unique: false });
        hab.createIndex('email', 'email', { unique: false });
        // ⬅️ NUEVO índice por fecha (string ISO)
        hab.createIndex('disponibleDesde', 'disponibleDesde', { unique: false });
      } else {
        // Si ya existía, añadimos el índice si no estaba (migración suave)
        const tx = e.currentTarget.transaction;
        const hab = tx.objectStore('habitaciones');
        try {
          hab.createIndex('disponibleDesde', 'disponibleDesde', { unique: false });
        } catch (_) {
          // índice ya existía: no pasa nada
        }
      }

      // === Alquileres ===
      if (!db.objectStoreNames.contains('alquileres')) {
        const alk = db.createObjectStore('alquileres', {
          keyPath: 'idContrato',
          autoIncrement: true
        });
        alk.createIndex('emailInquilino', 'emailInquilino', { unique: false });
        alk.createIndex('idhabi', 'idhabi', { unique: false });
      }

      // === Solicitudes ===
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

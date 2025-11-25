/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/subirPiso.js
// Requiere: db.js (openDB), sesión en sessionStorage.loggedInUser

async function ensureDB() {
  if (!window.db) window.db = await openDB(); // de db.js
  return window.db;
}

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Convierte un File (imagen) a base64 (DataURL). Si no hay archivo, devuelve null.
function fileToDataURL(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Exigir sesión
  const raw = sessionStorage.getItem('loggedInUser');
  if (!raw) { window.location.href = 'login.html'; return; }
  const user = JSON.parse(raw); // { email, nombre, ... }

  // 2) Default de fecha "Disponible desde"
  const fechaInput = document.getElementById('disponible-desde');
  if (fechaInput && !fechaInput.value) fechaInput.value = todayYYYYMMDD();

  // 3) Guardado
  const form = document.getElementById('form-subir-piso');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // NO navega

    // a) Lectura de campos
    const direccion = document.getElementById('direccion').value;         // ciudad
    const precioStr = document.getElementById('precio').value;
    const disponibleDesde = document.getElementById('disponible-desde').value;
    const latStr = document.getElementById('lat').value;
    const longiStr = document.getElementById('longi').value;
    const desc = document.getElementById('descripcion').value.trim();
    const file = document.getElementById('imagen-file').files?.[0] || null;

    // b) Validación básica
    const precio = parseInt(precioStr, 10);
    const lat = latStr ? Number(latStr) : null;
    const longi = longiStr ? Number(longiStr) : null;

    if (!direccion || Number.isNaN(precio) || !disponibleDesde) {
      alert('Rellena ciudad, precio y fecha.');
      return;
    }
    if (precio < 0) {
      alert('El precio debe ser ≥ 0.');
      return;
    }

    // c) Imagen (base64) o placeholder
    const dataURL = await fileToDataURL(file);
    const imagen = dataURL || 'images/hab/placeholder.jpg';

    // d) Escribir en IndexedDB
    try {
      const db = await ensureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['habitaciones'], 'readwrite');
        const store = tx.objectStore('habitaciones');
        store.add({
          // PK autoincrement: idHabitacion
          direccion,         // ciudad
          lat,               // número o null
          longi,             // número o null
          precio,            // número
          imagen,            // dataURL o ruta placeholder
          email: user.email, // propietario
          disponibleDesde,   // YYYY-MM-DD
          descripcion: desc || '',
          creadaEn: new Date().toISOString()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });

      alert('Piso guardado correctamente.');
      // Redirige manteniendo puerto y carpeta actual
      window.location.href = new URL('logueado.html', window.location.href).href;
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar el piso. Revisa la consola.');
    }
  });
});


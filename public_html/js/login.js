/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/* login.js — una sola función pública: loginUser() */
//let db = null;

// login.js

// Usa la conexión global creada en db.js (openDB establece window.db)
async function ensureDB() {
  if (!window.db) {
    window.db = await openDB();   // openDB viene de db.js
  }
  return window.db;
}

async function _loginUser(ev) {
  try {
    if (ev && ev.preventDefault) ev.preventDefault();

    const conn = await ensureDB();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, ingresa el email y la contraseña.');
      return;
    }

    // ¡OJO! Nombre de la store: 'usuarios' (plural), como definiste en db.js
    const tx = conn.transaction(['usuarios'], 'readonly');
    const store = tx.objectStore('usuarios');

    const user = await new Promise((resolve, reject) => {
      const req = store.get(email);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    });

    if (!user) {
      alert('El email no está registrado.');
      return;
    }
    if (user.password !== password) {
      alert('La contraseña es incorrecta.');
      return;
    }

    // Sesión + redirección
    if(user.password===password){ 
        alert(`¡Bienvenido, ${user.nombre}!`);

        sessionStorage.setItem('loggedInUser', JSON.stringify({
          email: user.email,
          nombre: user.nombre
        }));}
    window.location.href = 'logeado.html'; // o donde corresponda
  } catch (e) {
    console.error(e);
    alert('La base de datos no está disponible. Intenta de nuevo más tarde.');
  }
}

// Expón la función al ámbito global para el onclick del botón
window.loginUser = _loginUser;

// (Opcional) abre la BD al cargar para que el primer login sea instantáneo
document.addEventListener('DOMContentLoaded', () => { ensureDB().catch(console.error); });
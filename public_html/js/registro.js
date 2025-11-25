/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// registro.js
async function ensureDB(){
  if (!window.db) window.db = await openDB();
  return window.db;
}

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureDB();

  const form = document.getElementById('reg-form');
  const fotoInput = document.getElementById('foto');
  const preview = document.getElementById('preview');
  const msg = document.getElementById('reg-msg');

  // Vista previa de la foto
  if (fotoInput) {
    fotoInput.addEventListener('change', async () => {
      const f = fotoInput.files?.[0];
      if (!f) { preview.style.display = 'none'; return; }
      const url = await readFileAsDataURL(f).catch(() => null);
      if (url) {
        preview.src = url;
        preview.style.display = 'block';
      }
    });
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'reg-msg'; msg.textContent = '';

    const nombre = document.getElementById('nombre').value.trim();
    const email  = document.getElementById('email').value.trim().toLowerCase();
    const pass1  = document.getElementById('password').value;
    const pass2  = document.getElementById('password2').value;
    const acepto = document.getElementById('acepto').checked;

    if (!nombre || !email || !pass1 || !pass2) {
      msg.classList.add('err'); msg.textContent = 'Rellena todos los campos obligatorios.'; return;
    }
    if (pass1.length < 4) {
      msg.classList.add('err'); msg.textContent = 'La contraseña debe tener al menos 4 caracteres.'; return;
    }
    if (pass1 !== pass2) {
      msg.classList.add('err'); msg.textContent = 'Las contraseñas no coinciden.'; return;
    }
    if (!acepto) {
      msg.classList.add('err'); msg.textContent = 'Debes aceptar los términos.'; return;
    }

    // Foto (opcional)
    let fotoDataUrl = null;
    if (fotoInput.files && fotoInput.files[0]) {
      fotoDataUrl = await readFileAsDataURL(fotoInput.files[0]).catch(() => null);
    }

    // Comprobar duplicado y guardar
    const db = await ensureDB();
    const tx = db.transaction(['usuarios'], 'readwrite');
    const usuarios = tx.objectStore('usuarios');

    const exists = await new Promise((resolve, reject) => {
      const r = usuarios.get(email);
      r.onsuccess = () => resolve(!!r.result);
      r.onerror = () => reject(r.error);
    });

    if (exists) {
      msg.classList.add('err'); msg.textContent = 'Ese email ya está registrado.'; return;
    }

    await new Promise((resolve, reject) => {
      const addReq = usuarios.add({
        email,
        password: pass1,     // (para clase está bien; en real: **hash**)
        nombre,
        foto: fotoDataUrl    // o null si no se subió
      });
      addReq.onsuccess = () => resolve(true);
      addReq.onerror = () => reject(addReq.error);
    });

    // Auto-login y a logueado.html
    sessionStorage.setItem('loggedInUser', JSON.stringify({ email, nombre, foto: fotoDataUrl }));
    msg.classList.add('ok'); msg.textContent = 'Cuenta creada. Redirigiendo…';
    setTimeout(() => { window.location.href = 'logueado.html'; }, 600);
  });
});



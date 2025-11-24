/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  if (!form) return;

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ciudad = document.getElementById('ciudad').value || null;
    const min = parseInt(document.getElementById('price-min').value || '0', 10);
    const max = parseInt(document.getElementById('price-max').value || '2000', 10);

    sessionStorage.setItem('searchFiltersPublic', JSON.stringify({ ciudad, min, max }));
    window.location.href = 'resultadoSinLogin.html';
  });
});


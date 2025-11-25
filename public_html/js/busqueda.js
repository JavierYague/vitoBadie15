/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
/*document.addEventListener('DOMContentLoaded', () => {
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
});*/
function getFilters() {
  const ciudad = document.getElementById('ciudad')?.value || '';
  const min = parseInt(document.getElementById('price-min')?.value || '0', 10);
  const max = parseInt(document.getElementById('price-max')?.value || '2000', 10);
  const fecha = document.getElementById('fecha-desde')?.value || ''; // <-- NUEVO
  return { ciudad, min, max, fecha };
}

function goToPublicResults(e){
  if (e && e.preventDefault) e.preventDefault();
  const { ciudad, min, max, fecha } = getFilters();
  if (!fecha) { alert('Selecciona una fecha.'); return; }
  if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max){
    alert('Revisa el rango de precios (mínimo ≤ máximo).');
    return;
  }
  sessionStorage.setItem('searchFiltersPublic', JSON.stringify({ ciudad, min, max, fecha }));
  window.location.href = 'resultadoSinLogin.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', goToPublicResults);
});


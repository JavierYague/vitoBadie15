/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/index_search.js
function getFilters() {
  const ciudad = document.getElementById('ciudad')?.value || '';
  const min = parseInt(document.getElementById('price-min')?.value || '0', 10);
  const max = parseInt(document.getElementById('price-max')?.value || '2000', 10);
  return { ciudad, min, max };
}

function goToPublicResults(e){
  if (e && e.preventDefault) e.preventDefault();
  const { ciudad, min, max } = getFilters();

  if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max){
    alert('Revisa el rango de precios (mínimo ≤ máximo).');
    return;
  }
  // filtros para resultados públicos (sin login)
  sessionStorage.setItem('searchFiltersPublic', JSON.stringify({ ciudad, min, max }));
  window.location.href = 'resultadoSinLogin.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', goToPublicResults);
});



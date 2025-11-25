/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
// js/boot-seed.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await openDB();         // viene de db.js
    // await wipeAndSeed(); // usa esto solo si quieres resembrar a la fuerza
    await seedRoomMatch();  // viene de semilla.js (no duplica si ya hay datos)
  } catch (err) {
    console.error('Error inicializando la BD:', err);
  }
});


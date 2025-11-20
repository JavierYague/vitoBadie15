/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */
(async () => {
  try {
    await openDB();               // crea/abre la DB y stores
    await seedRoomMatch();        // solo inserta si no hay datos (lleva su hasData())
    console.log('IndexedDB lista.');
  } catch (err) {
    console.error('Fallo al inicializar RoomMatch:', err);
  }
})();


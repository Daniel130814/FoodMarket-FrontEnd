// DATOS TEMPORALES de ejemplo (paso 11b). Se borra al conectar el backend (paso 12).
// Misma forma que ResenaResponse de la API (ENDPOINTS.md, sección 3.12). La API NO trae el nombre
// del autor, solo clienteId: por eso la vista no muestra quién escribió cada reseña.
const RESENAS_EJEMPLO = [
  {
    id: 1,
    platoId: 1,
    calificacion: 5,
    comentario: 'La textura de la masa es increíble: sedosa pero firme. La manteca noisette con la salvia le da una profundidad que no encontrás ni en trattorias caras.',
    fechaCreacion: '2026-10-17T15:00:00',
    clienteId: 10,
  },
  {
    id: 2,
    platoId: 1,
    calificacion: 5,
    comentario: 'Llegó impecable, tibio y con las indicaciones exactas para la sartén. En 2 minutos teníamos una cena de aniversario. Los hongos se sentían frescos.',
    fechaCreacion: '2026-10-14T15:00:00',
    clienteId: 11,
  },
  {
    id: 3,
    platoId: 1,
    calificacion: 5,
    comentario: 'La ricotta de Tandil marca la diferencia: es cremosa y dulce, nada industrial. Clara es una artista de la pasta.',
    fechaCreacion: '2026-10-12T15:00:00',
    clienteId: 12,
  },
]

export default RESENAS_EJEMPLO

// DATOS TEMPORALES de ejemplo (paso 11b.10). Se borra al conectar el backend (paso 13).
// Es el catálogo de ingredientes que el chef puede elegir al publicar un plato.
// Misma forma que Ingrediente de la API (GET /ingredientes): { id, nombre, descripcion }.
// Los ids 1 a 8 son los que ya usan los platos de ejemplo.
const INGREDIENTES_EJEMPLO = [
  { id: 1, nombre: 'Harina orgánica de molino de piedra', descripcion: 'Harina de trigo molida despacio' },
  { id: 2, nombre: 'Ricotta fresca de oveja', descripcion: 'Cuajada natural de leche cruda' },
  { id: 3, nombre: 'Hongos silvestres recolectados', descripcion: 'Gírgolas y boletus de pinar' },
  { id: 4, nombre: 'Manteca de pastoreo y salvia', descripcion: 'Manteca de vacas en pastoreo libre' },
  { id: 5, nombre: 'Huevos de campo', descripcion: 'Huevos de gallinas criadas al aire libre' },
  { id: 6, nombre: 'Falda de manzo', descripcion: 'Corte para cocciones largas' },
  { id: 7, nombre: 'Vino tinto', descripcion: 'Malbec para reducciones' },
  { id: 8, nombre: 'Caldo de hueso', descripcion: 'Caldo casero de cocción lenta' },
  { id: 9, nombre: 'Sal marina', descripcion: 'Sal gruesa sin refinar' },
  { id: 10, nombre: 'Aceite de oliva', descripcion: 'Aceite extra virgen de primera prensa' },
  { id: 11, nombre: 'Tomate perita', descripcion: 'Tomate de huerta de estación' },
  { id: 12, nombre: 'Albahaca fresca', descripcion: 'Hojas frescas del huerto del taller' },
]

export default INGREDIENTES_EJEMPLO

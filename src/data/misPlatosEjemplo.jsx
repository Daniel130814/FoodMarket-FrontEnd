// DATOS TEMPORALES de ejemplo (paso 11b.10). Se borra al conectar el backend (paso 13).
// Son las publicaciones del chef de prueba, con la forma de PlatoResponse de la API.
// Incluyen platos en CUALQUIER estado (BORRADOR, PUBLICADO, AGOTADO, PAUSADO), algo que el
// catálogo público no muestra: GET /platos solo devuelve PUBLICADO y AGOTADO (ENDPOINTS.md, 3.3).
// En el paso 13 hay que resolver cómo traer los borradores y pausados (la API todavía no tiene
// un endpoint de "mis platos").
import PLATOS_EJEMPLO from './platosEjemplo'

// El chef de prueba es el chefId 1 (Matteo Rossi). Reutilizamos sus platos publicados y agotados
// (los de PLATOS_EJEMPLO) y sumamos dos más: uno en BORRADOR y otro PAUSADO.
const MIS_PLATOS_EJEMPLO = [
  ...PLATOS_EJEMPLO.filter((plato) => plato.chefId === 1),
  {
    id: 10,
    nombre: 'Gnocchi de papa y salvia',
    descripcion: 'Gnocchi de papa andina con manteca dorada y salvia fresca. Todavía falta sacarle fotos.',
    // Un BORRADOR puede no tener imágenes (la API solo las exige al publicar).
    imagenesUrls: [],
    precio: 13500,
    descuentoPorcentaje: 0,
    precioConDescuento: 13500,
    stockDisponible: 0,
    estado: 'BORRADOR',
    chefId: 1,
    // TODO(backend): chefNombre en los platos (la API todavía solo trae chefId).
    chefNombre: 'Matteo Rossi',
    categorias: ['Pastas'],
    ingredientes: [],
  },
  {
    id: 11,
    nombre: 'Risotto de hongos de pino',
    descripcion: 'Arroz carnaroli mantecado con hongos de pino y parmesano de 24 meses. Pausado hasta la próxima cosecha.',
    imagenesUrls: [PLATOS_EJEMPLO[0].imagenesUrls[0]],
    precio: 20000,
    descuentoPorcentaje: 10,
    precioConDescuento: 18000,
    stockDisponible: 5,
    estado: 'PAUSADO',
    chefId: 1,
    // TODO(backend): chefNombre en los platos (la API todavía solo trae chefId).
    chefNombre: 'Matteo Rossi',
    categorias: ['Vegetariano'],
    ingredientes: [],
  },
]

export default MIS_PLATOS_EJEMPLO

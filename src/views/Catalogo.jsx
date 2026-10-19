// Vista del catálogo (ruta /catalogo). Lista los platos con filtros, orden y paginación.
import { useState } from 'react'
import PlatoCard from '../components/PlatoCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PLATOS_EJEMPLO from '../data/platosEjemplo'
import CATEGORIAS_EJEMPLO from '../data/categoriasEjemplo'

// Cuántos platos se agregan al listado cada vez que se toca "Ver más".
const PLATOS_POR_PAGINA = 6

// Filtros al empezar (o al limpiar): todo vacío. categoriaId null = todas las categorías.
// Los precios se guardan como TEXTO porque vienen de inputs; se pasan a número al filtrar.
const FILTROS_INICIALES = { nombre: '', categoriaId: null, precioMin: '', precioMax: '' }

// ---------------------------------------------------------------------------------------
// FILTRADO DE EJEMPLO (TEMPORAL, se ELIMINA en el paso 12).
// Simula lo que hace el backend en GET /platos con los query params que soporta la API:
//   nombre, categoriaId, precioMin, precioMax.
// En el paso 12 esta función se borra: los filtros se mandan en la URL (?nombre=...&precioMin=...)
// y la API devuelve la lista ya filtrada. (La regla de la profe: el filtrado real lo hace el backend.)
// Recibe la lista de platos y el objeto de filtros; devuelve una lista NUEVA con los que cumplen.
// ---------------------------------------------------------------------------------------
const filtrarPlatos = (platos, filtros) => {
  const texto = filtros.nombre.trim().toLowerCase()
  // El filtro de categoría usa el id, pero cada plato guarda los NOMBRES de sus categorías
  // (así lo manda la API); buscamos la descripción de la categoría elegida.
  const categoria = CATEGORIAS_EJEMPLO.find((c) => c.id === filtros.categoriaId)

  // .filter() recorre el array y se queda con los elementos para los que la función devuelve true.
  return platos.filter((plato) => {
    // La API solo devuelve platos PUBLICADO o AGOTADO (nunca borradores ni pausados).
    if (plato.estado !== 'PUBLICADO' && plato.estado !== 'AGOTADO') return false
    // Nombre: coincidencia parcial sin importar mayúsculas (la semántica exacta del backend no está confirmada).
    if (texto !== '' && !plato.nombre.toLowerCase().includes(texto)) return false
    if (categoria !== undefined && !plato.categorias.includes(categoria.description)) return false
    // Precio: se compara contra el precio base. Number('') daría 0, por eso se chequea que no esté vacío.
    if (filtros.precioMin !== '' && plato.precio < Number(filtros.precioMin)) return false
    if (filtros.precioMax !== '' && plato.precio > Number(filtros.precioMax)) return false
    return true
  })
}

// ORDEN (se queda en el front: la API NO tiene ordenamiento).
// .sort() modifica el array original, y el estado/los datos nunca se modifican; por eso primero
// hacemos una COPIA con [...platos] y ordenamos la copia.
// sort llama a una función de comparación con dos platos (a, b):
//   - devuelve un número negativo si 'a' va antes que 'b'
//   - positivo si 'a' va después, y 0 si da igual.
const ordenarPlatos = (platos, orden) => {
  const copia = [...platos]
  if (orden === 'precio-asc') {
    return copia.sort((a, b) => a.precioConDescuento - b.precioConDescuento)
  }
  if (orden === 'precio-desc') {
    return copia.sort((a, b) => b.precioConDescuento - a.precioConDescuento)
  }
  if (orden === 'nombre-asc') {
    // localeCompare compara textos respetando acentos y la ñ del idioma elegido
    return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }
  // 'sin-orden': se respeta el orden en que vienen los platos
  return copia
}

// Props:
//  - onAdd: función (platoId, cantidad) de App. Catalogo no la usa: solo la reenvía a cada PlatoCard.
function Catalogo({ onAdd }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 12, cuando haya un fetch que los cambie.
  //  - cargando: true mientras esperamos la respuesta de la API.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // ESTADO de los filtros: un solo objeto con todos los campos (inputs controlados).
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  // ESTADO del orden elegido en el selector.
  const [orden, setOrden] = useState('sin-orden')

  // ESTADO de la paginación: cuántas "páginas" de platos se están mostrando. Empieza en 1.
  const [paginaActual, setPaginaActual] = useState(1)

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando el catálogo..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Handler de los inputs de texto y precio. event.target.name dice qué filtro cambió (nombre,
  // precioMin, precioMax) y value es lo que escribió el usuario. [name]: value es una "clave
  // calculada". Al cambiar un filtro volvemos a la página 1, porque la lista cambió.
  const handleFiltroChange = (event) => {
    const { name, value } = event.target
    setFiltros({ ...filtros, [name]: value })
    setPaginaActual(1)
  }

  // Handler de los chips. Recibe el id de la categoría (o null para "Todas").
  const handleCategoria = (id) => {
    setFiltros({ ...filtros, categoriaId: id })
    setPaginaActual(1)
  }

  const handleOrdenChange = (event) => {
    setOrden(event.target.value)
    setPaginaActual(1)
  }

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES)
    setOrden('sin-orden')
    setPaginaActual(1)
  }

  // VALIDACIÓN de precios, igual que la API (devuelve 400 si hay precios negativos o si el
  // mínimo es mayor que el máximo). Es un valor calculado: no se guarda en un estado.
  const hayNegativos = Number(filtros.precioMin) < 0 || Number(filtros.precioMax) < 0
  const minMayorQueMax =
    filtros.precioMin !== '' && filtros.precioMax !== '' && Number(filtros.precioMin) > Number(filtros.precioMax)
  // Ternario encadenado: si pasa lo primero, ese mensaje; si no, si pasa lo segundo, el otro; si no, null.
  const errorPrecios = hayNegativos
    ? 'Los precios no pueden ser negativos.'
    : minMayorQueMax
      ? 'El precio mínimo no puede ser mayor que el máximo.'
      : null

  // PIPELINE de la lista, paso a paso (todos son valores calculados en cada render):
  //  1) filtrar (si los precios son inválidos, ignoramos el filtro de precio)
  //  2) ordenar la lista ya filtrada
  //  3) paginar: slice(0, n) devuelve una copia con los primeros n elementos
  const filtrosAplicados = errorPrecios === null ? filtros : { ...filtros, precioMin: '', precioMax: '' }
  const platosFiltrados = filtrarPlatos(PLATOS_EJEMPLO, filtrosAplicados)
  const platosOrdenados = ordenarPlatos(platosFiltrados, orden)
  const platosVisibles = platosOrdenados.slice(0, paginaActual * PLATOS_POR_PAGINA)

  // ¿Hay algún filtro u orden activo? Sirve para mostrar el botón "Limpiar".
  const hayFiltros = filtros.nombre !== '' || filtros.categoriaId !== null || filtros.precioMin !== '' || filtros.precioMax !== '' || orden !== 'sin-orden'

  return (
    <>
      <h1 className="font-display text-headline-lg text-primary">Catálogo</h1>
      <div className="mt-8">
        <SearchBar value={filtros.nombre} onChange={handleFiltroChange} />
      </div>
      <div className="mt-4">
        <CategoryChips categories={CATEGORIAS_EJEMPLO} selectedId={filtros.categoriaId} onSelect={handleCategoria} />
      </div>

      {/* Precio mínimo, precio máximo y orden: cada input tiene su label y es controlado */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="precioMin">Precio mínimo</label>
          <input
            id="precioMin"
            name="precioMin"
            type="number"
            min="0"
            className="field"
            placeholder="$ 0"
            value={filtros.precioMin}
            onChange={handleFiltroChange}
            aria-invalid={errorPrecios !== null ? 'true' : 'false'}
          />
        </div>
        <div>
          <label className="label" htmlFor="precioMax">Precio máximo</label>
          <input
            id="precioMax"
            name="precioMax"
            type="number"
            min="0"
            className="field"
            placeholder="$ 30000"
            value={filtros.precioMax}
            onChange={handleFiltroChange}
            aria-invalid={errorPrecios !== null ? 'true' : 'false'}
          />
        </div>
        <div>
          <label className="label" htmlFor="orden">Ordenar por</label>
          <select id="orden" name="orden" className="field" value={orden} onChange={handleOrdenChange}>
            <option value="sin-orden">Sin orden</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre-asc">Nombre: A a Z</option>
          </select>
        </div>
      </div>
      {/* Renderizado condicional: el error de precios solo aparece si hay uno */}
      {errorPrecios !== null && (
        <p className="hint hint--error" role="alert">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          <span>{errorPrecios}</span>
        </p>
      )}
      {hayFiltros && (
        <div className="mt-4">
          <Button variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>
        </div>
      )}

      {platosFiltrados.length === 0 ? (
        <EmptyState
          title="No encontramos platos"
          message="Probá con otro nombre, otra categoría o un rango de precios distinto."
          actionLabel="Limpiar filtros"
          onAction={limpiarFiltros}
        />
      ) : (
        <>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {/* map: una tarjeta por plato. key = id del plato, único y estable */}
            {platosVisibles.map((plato) => (
              <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
            ))}
          </div>
          {/* "Ver más" suma una página: se muestran más platos de la misma lista */}
          <Pagination
            shown={platosVisibles.length}
            total={platosFiltrados.length}
            onMore={() => setPaginaActual(paginaActual + 1)}
          />
        </>
      )}
    </>
  )
}

export default Catalogo

// Vista del catálogo (ruta /catalogo). Pide los platos y las categorías al backend (GET /platos y
// GET /categories), filtra con query params y ordena y pagina en el front (la API no tiene orden ni paginación).
import { useEffect, useState } from 'react'
import PlatoCard from '../components/PlatoCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

// Cuántos platos se agregan al listado cada vez que se toca "Ver más".
const PLATOS_POR_PAGINA = 6

// Filtros al empezar (o al limpiar): todo vacío. categoriaId null = todas las categorías.
// Los precios se guardan como TEXTO porque vienen de inputs; se mandan tal cual en la URL.
const FILTROS_INICIALES = { nombre: '', categoriaId: null, precioMin: '', precioMax: '' }

// Lee una respuesta del backend y devuelve lo que viene en "data". Si el servidor respondió con un
// error (400, 404, 500...) lanza un Error con el "message" del backend y el código en "status".
// Hace falta porque fetch NO manda los errores HTTP al .catch(): hay que mirar response.ok nosotros.
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// ORDEN (se queda en el front: la API NO tiene ordenamiento).
// .sort() modifica el array original, y el estado nunca se modifica; por eso primero hacemos una
// COPIA con [...platos] y ordenamos la copia.
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
//  - onAdd: función (plato, cantidad) de App. Catalogo no la usa: solo la reenvía a cada PlatoCard.
function Catalogo({ onAdd }) {
  // ESTADO de los datos que llegan del backend. Arrancan vacíos y se llenan cuando responde la API.
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])

  // ESTADOS de carga y error de la lista de platos.
  //  - cargando: true hasta que llega la primera respuesta.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  // Si las categorías fallan, solo avisamos debajo de los chips (la lista de platos igual se puede usar).
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [errorCategorias, setErrorCategorias] = useState(false)

  // ESTADO de los filtros: un solo objeto con todos los campos (inputs controlados).
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  // ESTADO del orden elegido en el selector.
  const [orden, setOrden] = useState('sin-orden')

  // ESTADO de la paginación: cuántas "páginas" de platos se están mostrando. Empieza en 1.
  const [paginaActual, setPaginaActual] = useState(1)

  // VALIDACIÓN de precios, igual que la API (devuelve 400 si hay precios negativos o si el
  // mínimo es mayor que el máximo). Es un valor calculado: no se guarda en un estado.
  // La hacemos ANTES de pedir los platos para no mandarle al backend un filtro inválido.
  const hayNegativos = Number(filtros.precioMin) < 0 || Number(filtros.precioMax) < 0
  const minMayorQueMax =
    filtros.precioMin !== '' && filtros.precioMax !== '' && Number(filtros.precioMin) > Number(filtros.precioMax)
  // Ternario encadenado: si pasa lo primero, ese mensaje; si no, si pasa lo segundo, el otro; si no, null.
  const errorPrecios = hayNegativos
    ? 'Los precios no pueden ser negativos.'
    : minMayorQueMax
      ? 'El precio mínimo no puede ser mayor que el máximo.'
      : null

  // Los valores que realmente se mandan al backend. Si los precios son inválidos, no se mandan.
  const nombre = filtros.nombre.trim()
  const categoriaId = filtros.categoriaId
  const precioMin = errorPrecios === null ? filtros.precioMin.trim() : ''
  const precioMax = errorPrecios === null ? filtros.precioMax.trim() : ''

  // CATEGORÍAS: se piden una sola vez, al abrir la vista ([] = sin dependencias). Es un GET, por
  // eso va en un useEffect. Es una ruta pública: NO mandamos el token.
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(leerRespuesta)
      // La API devuelve data: null cuando la lista está vacía; ?? [] lo convierte en lista vacía.
      .then((data) => setCategorias(data ?? []))
      .catch(() => setErrorCategorias(true))
  }, [])

  // PLATOS: se piden al abrir la vista y CADA VEZ que cambia un filtro. Por eso el segundo
  // argumento de useEffect lista los filtros: React vuelve a ejecutar el efecto cuando alguno cambia.
  // El filtrado lo hace el backend: mandamos los filtros como query params (?nombre=...&categoriaId=...).
  useEffect(() => {
    // AbortController permite cancelar un pedido en curso. Si el usuario sigue escribiendo, el pedido
    // anterior se cancela y no puede llegar tarde y pisar el resultado del pedido nuevo.
    const controlador = new AbortController()

    // URLSearchParams arma el texto de los query params y se encarga de codificar los caracteres
    // especiales (espacios, tildes). Solo agregamos los filtros que tienen valor.
    const parametros = new URLSearchParams()
    if (nombre !== '') parametros.set('nombre', nombre)
    if (categoriaId !== null) parametros.set('categoriaId', categoriaId)
    if (precioMin !== '') parametros.set('precioMin', precioMin)
    if (precioMax !== '') parametros.set('precioMax', precioMax)

    fetch(`${API_URL}/platos?${parametros.toString()}`, { signal: controlador.signal })
      .then(leerRespuesta)
      .then((data) => {
        setPlatos(data ?? [])
        setError(null)
        setCargando(false)
      })
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error: ya viene otro en camino.
        if (fallo.name === 'AbortError') {
          return
        }
        // Sin status, ni siquiera llegamos al servidor (apagado o bloqueado).
        setError(
          fallo.status === undefined
            ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
            : fallo.message
        )
        setCargando(false)
      })

    // Función de limpieza: React la ejecuta antes de volver a correr el efecto (o al salir de la vista).
    return () => controlador.abort()
  }, [nombre, categoriaId, precioMin, precioMax])

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

  // PIPELINE de la lista, con los platos que ya filtró el backend (valores calculados en cada render):
  //  1) ordenar (en el front)
  //  2) paginar: slice(0, n) devuelve una copia con los primeros n elementos
  const platosOrdenados = ordenarPlatos(platos, orden)
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
        <CategoryChips categories={categorias} selectedId={filtros.categoriaId} onSelect={handleCategoria} />
        {errorCategorias && (
          <p className="hint hint--error">No pudimos cargar las categorías.</p>
        )}
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

      {/* Los filtros siempre se ven; lo que cambia es el contenido de la lista según el estado:
          cargando, error, sin resultados o platos. */}
      {cargando ? (
        <LoadingState message="Cargando el catálogo..." />
      ) : error !== null ? (
        <ErrorState message={error} />
      ) : platos.length === 0 ? (
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
            total={platosOrdenados.length}
            onMore={() => setPaginaActual(paginaActual + 1)}
          />
        </>
      )}
    </>
  )
}

export default Catalogo

// Inicio (/): portada con buscador y categorías, platos de hoy y chefs (GET /platos, /categories y /chef-profiles).
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PlatoCard from '../components/platos/PlatoCard'
import SearchBar from '../components/platos/SearchBar'
import CategoryChips from '../components/platos/CategoryChips'
import ChefCard from '../components/platos/ChefCard'
import LogoCloche from '../components/layout/LogoCloche'
import ContenidoAsync from '../components/comunes/ContenidoAsync'

// URL base del backend (viene de .env).
const API_URL = import.meta.env.VITE_API_URL

// Devuelve `data` o lanza un Error con message y status (fetch no manda los errores HTTP al .catch).
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// Props: onAdd (agregar a la cesta de App; solo se reenvía a cada PlatoCard).
function Inicio({ onAdd }) {
  const navigate = useNavigate()
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])

  // Texto del buscador de la portada: se manda al catálogo al enviar.
  const [busqueda, setBusqueda] = useState('')

  // Perfiles de chef, con su carga y error: si fallan, solo se avisa en su sección.
  const [chefs, setChefs] = useState([])
  const [cargandoChefs, setCargandoChefs] = useState(true)
  const [errorChefs, setErrorChefs] = useState(false)

  // Si las categorías fallan, solo se avisa debajo de los chips: el resto de la portada se puede usar.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [errorCategorias, setErrorCategorias] = useState(false)

  // Al abrir: pide los platos y las categorías, cada uno en su efecto. Rutas públicas: sin token.
  useEffect(() => {
    // Se cancela si salimos de la vista antes de que responda.
    const controlador = new AbortController()

    fetch(`${API_URL}/platos`, { signal: controlador.signal })
      .then(leerRespuesta)
      .then((data) => {
        setPlatos(data ?? [])
        setCargando(false)
      })
      .catch((fallo) => {
        if (fallo.name === 'AbortError') {
          return
        }
        setError(
          fallo.status === undefined
            ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
            : fallo.message
        )
        setCargando(false)
      })

    return () => controlador.abort()
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(leerRespuesta)
      .then((data) => setCategorias(data ?? []))
      .catch(() => setErrorCategorias(true))
  }, [])

  // GET /chef-profiles (público, sin token).
  useEffect(() => {
    fetch(`${API_URL}/chef-profiles`)
      .then(leerRespuesta)
      .then((data) => setChefs(data ?? [])) // lista vacía llega como null
      .catch(() => setErrorChefs(true))
      .finally(() => setCargandoChefs(false))
  }, [])

  const manejarBusqueda = (event) => {
    setBusqueda(event.target.value)
  }

  // Va al catálogo con el texto en el state de la navegación (sin fetch acá); vacío = sin filtro.
  const buscar = (event) => {
    event.preventDefault()
    navigate('/catalogo', { state: { nombre: busqueda.trim() } })
  }

  // Los primeros 4 platos para "Platos de hoy".
  const platosDeHoy = platos.slice(0, 4)

  // Contenido de la sección de chefs según el estado (carga, error, vacío o tarjetas), con if y return en vez de ternarios anidados.
  const contenidoChefs = () => {
    if (cargandoChefs) {
      return <p className="mt-12 text-body-md text-on-surface-variant">Cargando los chefs...</p>
    }
    if (errorChefs) {
      return <p className="hint hint--error mt-12">No pudimos cargar los chefs.</p>
    }
    if (chefs.length === 0) {
      return <p className="mt-12 text-body-md text-on-surface-variant">Todavía no hay chefs con perfil.</p>
    }
    return (
      <ul className="mt-12 divide-y divide-hairline md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* Solo 3 perfiles: el diseño tiene 3 columnas */}
        {chefs.slice(0, 3).map((chef) => (
          <ChefCard key={chef.id} chef={chef} />
        ))}
      </ul>
    )
  }

  return (
    <>
      {/* Portada: el logo grande aparece al levantar la cloche */}
      <section className="grid place-items-center py-10 lg:py-16">
        <LogoCloche />
        {/* Único h1 de la página */}
        <h1 className="aparece balance mt-8 text-center font-display text-display-lg-mobile text-primary lg:text-display-lg">
          ¿Qué te gustaría comer hoy?
        </h1>

        {/* Buscador: entra un poco después del titular */}
        <form onSubmit={buscar} className="aparece mt-8 flex w-full max-w-xl items-center gap-3" style={{ '--retraso': '1.8s' }}>
          <div className="flex-1">
            <SearchBar value={busqueda} onChange={manejarBusqueda} placeholder="Buscá un plato, por ejemplo ravioles" />
          </div>
          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>

        {/* Chips de categorías: entran al final de la secuencia (siguen siendo decorativos, como antes) */}
        <div role="group" aria-label="Categorías" className="aparece mt-6 w-full max-w-xl" style={{ '--retraso': '2s' }}>
          <CategoryChips categories={categorias} />
          {errorCategorias && (
            <p className="hint hint--error">No pudimos cargar las categorías.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="h-hoy" className="mt-14 lg:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="h-hoy" className="font-display text-headline-lg text-primary">Para pedir hoy</h2>
            <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
              Platos que se están cocinando ahora. Cuando se acaban las porciones, se acaban.
            </p>
          </div>
          <Link to="/catalogo" className="link text-label-lg">Ver todos los platos</Link>
        </div>
        <ContenidoAsync
          cargando={cargando}
          error={error}
          vacio={platosDeHoy.length === 0}
          mensajeCarga="Cargando los platos de hoy..."
          mensajeVacio="Todavía no hay platos publicados."
        >
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {platosDeHoy.map((plato) => (
              <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
            ))}
          </div>
        </ContenidoAsync>
      </section>

      {/* TODO(backend): el perfil de chef no trae el nombre de la persona ni su taller; la tarjeta no los muestra. */}
      <section aria-labelledby="h-chefs" className="mt-20 lg:mt-28">
        <h2 id="h-chefs" className="font-display text-headline-lg text-primary">Quiénes cocinan</h2>
        <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
          Talleres chicos, con nombre y apellido. Cada chef firma lo que cocina.
        </p>
        {contenidoChefs()}
      </section>
    </>
  )
}

export default Inicio

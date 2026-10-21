// Vista de inicio (ruta /). Muestra la portada, las categorías, los platos de hoy y los chefs.
// Pide al backend los platos, las categorías y los perfiles de chef (GET /platos, /categories y /chef-profiles).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PlatoCard from '../components/PlatoCard'
import CategoryChips from '../components/CategoryChips'
import ChefCard from '../components/ChefCard'
import Hero3D from '../components/Hero3D'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

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

// Props:
//  - onAdd: función (plato, cantidad) de App. Inicio no la usa: solo la reenvía a cada PlatoCard.
function Inicio({ onAdd }) {
  // ESTADO de los datos que llegan del backend. Arrancan vacíos y se llenan cuando responde la API.
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])

  // ESTADOS de los perfiles de chef: la lista, si todavía se están pidiendo y si falló. Si fallan, solo
  // avisamos en su sección (el resto de la portada se puede usar).
  const [chefs, setChefs] = useState([])
  const [cargandoChefs, setCargandoChefs] = useState(true)
  const [errorChefs, setErrorChefs] = useState(false)

  // ESTADOS de carga y error de la lista de platos.
  //  - cargando: true hasta que llega la respuesta.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  // Si las categorías fallan, solo avisamos debajo de los chips (el resto de la portada se puede usar).
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [errorCategorias, setErrorCategorias] = useState(false)

  // Pide los platos y las categorías una sola vez, al abrir la vista ([] = sin dependencias). Son
  // GET, por eso van en useEffect. Son rutas públicas: NO mandamos el token.
  // Cada efecto guarda su resultado en su propio estado y no hace falta volver a pedir nada después.
  useEffect(() => {
    // AbortController permite cancelar el pedido si salimos de la vista antes de que responda.
    const controlador = new AbortController()

    fetch(`${API_URL}/platos`, { signal: controlador.signal })
      .then(leerRespuesta)
      // La API devuelve data: null cuando la lista está vacía; ?? [] lo convierte en lista vacía.
      .then((data) => {
        setPlatos(data ?? [])
        setCargando(false)
      })
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error.
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

    // Función de limpieza: React la ejecuta al salir de la vista.
    return () => controlador.abort()
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(leerRespuesta)
      .then((data) => setCategorias(data ?? []))
      .catch(() => setErrorCategorias(true))
  }, [])

  // GET /chef-profiles (paso 14e): los perfiles de chef. Ruta pública: NO mandamos el token.
  useEffect(() => {
    fetch(`${API_URL}/chef-profiles`)
      .then(leerRespuesta)
      .then((data) => setChefs(data ?? [])) // lista vacía llega como null
      .catch(() => setErrorChefs(true))
      .finally(() => setCargandoChefs(false))
  }, [])

  // slice(0, 4) devuelve una copia con los primeros 4 platos (sin modificar la lista original).
  const platosDeHoy = platos.slice(0, 4)

  return (
    <>
      {/* Portada: el texto a la izquierda y el hero con 3D a la derecha (en el celular, uno debajo del otro) */}
      <section className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <h1 className="font-display text-display-lg text-primary">
            Platos de autor, cocinados hoy por chefs de tu barrio
          </h1>
          <p className="mt-5 max-w-[34rem] text-body-lg text-on-surface-variant">
            Pedile a talleres pequeños e independientes. Cada plato se prepara en tandas cortas y llega el mismo día.
          </p>
          <Link to="/catalogo" className="btn btn-primary mt-8">Ver los platos</Link>
        </div>
        <div className="lg:col-span-5">
          {/* La tarjeta del hero muestra el primer plato publicado (find devuelve undefined si todavía no hay). */}
          <Hero3D plato={platos.find((plato) => plato.estado === 'PUBLICADO')} onAdd={onAdd} />
        </div>
      </section>

      <section aria-labelledby="h-esp" className="mt-14">
        <h2 id="h-esp" className="mb-3 text-label-lg text-on-surface-variant">Qué se te antoja</h2>
        <CategoryChips categories={categorias} />
        {errorCategorias && (
          <p className="hint hint--error">No pudimos cargar las categorías.</p>
        )}
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
        {/* Renderizado condicional: según el estado mostramos la carga, el error, un aviso si no hay
            platos, o las tarjetas. */}
        {cargando ? (
          <LoadingState message="Cargando los platos de hoy..." />
        ) : error !== null ? (
          <ErrorState message={error} />
        ) : platosDeHoy.length === 0 ? (
          <p className="mt-10 text-body-md text-on-surface-variant">Todavía no hay platos publicados.</p>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* map: una tarjeta por plato. key = id del plato, único y estable */}
            {platosDeHoy.map((plato) => (
              <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
            ))}
          </div>
        )}
      </section>

      {/* TODO(backend): el perfil de chef no trae el nombre de la persona ni su taller (GET /chef-profiles
          trae especialidad, biografía, descripción, foto y reputación), así que la tarjeta no los muestra. */}
      <section aria-labelledby="h-chefs" className="mt-20 lg:mt-28">
        <h2 id="h-chefs" className="font-display text-headline-lg text-primary">Quiénes cocinan</h2>
        <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
          Talleres chicos, con nombre y apellido. Cada chef firma lo que cocina.
        </p>
        {/* Renderizado condicional: la carga, el error, un aviso si no hay perfiles, o las tarjetas. */}
        {cargandoChefs ? (
          <p className="mt-12 text-body-md text-on-surface-variant">Cargando los chefs...</p>
        ) : errorChefs ? (
          <p className="hint hint--error mt-12">No pudimos cargar los chefs.</p>
        ) : chefs.length === 0 ? (
          <p className="mt-12 text-body-md text-on-surface-variant">Todavía no hay chefs con perfil.</p>
        ) : (
          <ul className="mt-12 divide-y divide-hairline md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
            {/* slice(0, 3): el diseño tiene 3 columnas. map: una tarjeta por perfil; key = id del perfil */}
            {chefs.slice(0, 3).map((chef) => (
              <ChefCard key={chef.id} chef={chef} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Inicio

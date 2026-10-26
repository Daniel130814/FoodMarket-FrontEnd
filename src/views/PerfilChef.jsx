// Perfil público de un chef (/chef/:userId): su presentación, sus platos y las reseñas que recibió (GET /chef-profiles, /platos y /resenas).
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ChefCard from '../components/platos/ChefCard'
import PlatoCard from '../components/platos/PlatoCard'
import ReviewList from '../components/platos/ReviewList'
import EmptyState from '../components/comunes/EmptyState'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

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

// GET público (sin token); las listas vacías llegan como null.
const pedirLista = (ruta, signal) =>
  fetch(`${API_URL}${ruta}`, { signal })
    .then(leerRespuesta)
    .then((data) => data ?? [])

// Props: onAdd (agregar a la cesta de App; solo se reenvía a cada PlatoCard).
function PerfilChef({ onAdd }) {
  const navigate = useNavigate()

  // El id de la URL es el del usuario del chef (el mismo que trae cada plato en chefId). Llega como string.
  const { userId } = useParams()
  const chefId = Number(userId)
  const idValido = Number.isInteger(chefId) && chefId > 0

  // Lo que devuelve la API ya recortado a este chef: su perfil (null si no cargó uno), sus platos y sus reseñas.
  const [perfil, setPerfil] = useState(null)
  const [platos, setPlatos] = useState([])
  const [resenas, setResenas] = useState([])

  // cargando arranca en true solo si hay que pedir datos (id válido).
  const [cargando, setCargando] = useState(idValido)
  const [error, setError] = useState(null)

  // Al abrir o si cambia el chef: GET /chef-profiles, /platos y /resenas juntos. Ruta pública: sin token.
  useEffect(() => {
    if (!idValido) {
      return
    }

    // Se cancela si salimos de la vista antes de que respondan.
    const controlador = new AbortController()

    Promise.all([
      pedirLista('/chef-profiles', controlador.signal),
      pedirLista('/platos', controlador.signal),
      pedirLista('/resenas', controlador.signal),
    ])
      .then(([perfiles, todosLosPlatos, todasLasResenas]) => {
        // La API no filtra por chef: GET /platos ignora chefId y no hay reseñas por chef, así que se recorta acá.
        const platosDelChef = todosLosPlatos.filter((plato) => plato.chefId === chefId)
        const resenasDelChef = todasLasResenas
          .filter((resena) => platosDelChef.some((plato) => plato.id === resena.platoId))
          // Cada reseña lleva el nombre de su plato para que se entienda de qué es.
          .map((resena) => ({
            ...resena,
            platoNombre: platosDelChef.find((plato) => plato.id === resena.platoId).nombre,
          }))

        setPerfil(perfiles.find((perfilChef) => perfilChef.userId === chefId) ?? null)
        setPlatos(platosDelChef)
        setResenas(resenasDelChef)
        setError(null)
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
  }, [chefId, idValido])

  if (cargando) {
    return <LoadingState message="Cargando el perfil del chef..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Sin perfil ni platos no hay nada que mostrar: el chef no existe, no cocina o no tiene nada publicado.
  if (!idValido || (perfil === null && platos.length === 0)) {
    return (
      <EmptyState
        title="Este chef no está disponible"
        message="Puede que no exista o que todavía no tenga platos publicados."
        actionLabel="Ver los platos"
        onAction={() => navigate('/catalogo')}
      />
    )
  }

  const tieneResenas = resenas.length > 0

  // Promedio de las reseñas que se muestran, a 1 decimal; sin reseñas queda en null para no dividir por 0.
  const promedio = tieneResenas
    ? resenas.reduce((acumulado, resena) => acumulado + resena.calificacion, 0) / resenas.length
    : null
  const promedioTexto = promedio === null
    ? ''
    : (Math.round(promedio * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1 })

  return (
    <>
      <Link to="/catalogo" className="inline-flex min-h-[44px] items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
        Volver a los platos
      </Link>
      <h1 className="mt-4 font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Perfil del chef</h1>

      {/* TODO(backend): nombre, apellido y nacionalidad del chef; el perfil público solo trae especialidad, foto y textos. */}
      {perfil === null ? (
        <p className="mt-6 text-body-md text-on-surface-variant">Este chef todavía no cargó su presentación.</p>
      ) : (
        <ul className="mt-6 max-w-2xl">
          <ChefCard chef={perfil} />
        </ul>
      )}

      <p className="mt-6 text-label-md text-primary">
        {tieneResenas ? (
          <>
            ★ {promedioTexto}{' '}
            <span className="font-normal text-on-surface-variant">
              ({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </>
        ) : (
          <span className="font-normal text-on-surface-variant">Todavía sin reseñas</span>
        )}
      </p>

      <section className="mt-14" aria-labelledby="h-platos-chef">
        <h2 id="h-platos-chef" className="font-display text-headline-md text-primary">Lo que cocina</h2>
        {platos.length === 0 ? (
          <p className="mt-6 text-body-md text-on-surface-variant">Por ahora no tiene platos publicados.</p>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {platos.map((plato) => (
              <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
            ))}
          </div>
        )}
      </section>

      {tieneResenas && (
        <div className="mt-16">
          <ReviewList reviews={resenas} title="Lo que dicen de sus platos" />
        </div>
      )}
    </>
  )
}

export default PerfilChef

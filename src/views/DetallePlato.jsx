// Detalle de un plato (/plato/:id): GET /platos/{id}, /resenas/plato/{id} y /chef-profiles, y agregar a la cesta.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/comunes/Button'
import EmptyState from '../components/comunes/EmptyState'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'
import Gallery from '../components/platos/Gallery'
import QuantityStepper from '../components/cesta/QuantityStepper'
import IngredientTrace from '../components/platos/IngredientTrace'
import ReviewList from '../components/platos/ReviewList'
import ChefCard from '../components/platos/ChefCard'

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

// Props: onAdd (agregar a la cesta de App; la vista solo avisa y App decide si se puede).
function DetallePlato({ onAdd }) {
  // Ojo: el id de la URL es un string.
  const { id } = useParams()

  const navigate = useNavigate()

  // Cantidad elegida: vive acá y no en QuantityStepper porque el botón de agregar y el precio también la necesitan.
  const [cantidad, setCantidad] = useState(1)

  // noDisponible: el backend respondió 404 (el plato no existe o está pausado).
  const [plato, setPlato] = useState(null)
  const [resenas, setResenas] = useState([])
  const [noDisponible, setNoDisponible] = useState(false)

  // Perfil del chef del plato, o null si no tiene (no todos los chefs lo cargaron).
  const [perfilChef, setPerfilChef] = useState(null)

  // Un id que no es entero positivo (/plato/abc) no se le pregunta al backend: respondería 500.
  const idValido = Number.isInteger(Number(id)) && Number(id) > 0

  // cargando arranca en true solo si hay que pedir el plato (id válido).
  const [cargando, setCargando] = useState(idValido)
  const [error, setError] = useState(null)

  // Pide el plato y sus reseñas al abrir y si cambia el id. Ruta pública: sin token.
  useEffect(() => {
    if (!idValido) {
      return
    }

    // Se cancela si salimos de la vista antes de que responda.
    const controlador = new AbortController()

    fetch(`${API_URL}/platos/${id}`, { signal: controlador.signal })
      .then(leerRespuesta)
      // Las reseñas y el perfil se piden después: si el plato no existe, ya se cortó con el 404.
      .then((platoApi) =>
        Promise.all([
          fetch(`${API_URL}/resenas/plato/${id}`, { signal: controlador.signal }).then(leerRespuesta),
          // El perfil es un extra: si falla, el detalle se ve igual. No hay endpoint por chefId, así que se busca en la lista.
          fetch(`${API_URL}/chef-profiles`, { signal: controlador.signal })
            .then(leerRespuesta)
            .catch(() => null),
        ]).then(([resenasApi, perfilesApi]) => ({
          platoApi,
          resenasApi,
          perfilApi: (perfilesApi ?? []).find((perfil) => perfil.userId === platoApi.chefId) ?? null,
        }))
      )
      .then(({ platoApi, resenasApi, perfilApi }) => {
        setPlato(platoApi)
        setResenas(resenasApi ?? [])
        setPerfilChef(perfilApi)
        setNoDisponible(false)
        setError(null)
        setCargando(false)
      })
      .catch((fallo) => {
        if (fallo.name === 'AbortError') {
          return
        }
        // 404: el plato no existe o no está publicado; no es una falla, es "no disponible".
        if (fallo.status === 404) {
          setNoDisponible(true)
        } else {
          setError(
            fallo.status === undefined
              ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
              : fallo.message
          )
        }
        setCargando(false)
      })

    return () => controlador.abort()
  }, [id, idValido])

  if (cargando) {
    return <LoadingState message="Cargando el plato..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  if (!idValido || noDisponible || plato === null) {
    return (
      <EmptyState
        title="Este plato no está disponible"
        message="Puede que se haya pausado o que ya no exista."
        actionLabel="Volver al catálogo"
        onAction={() => navigate('/catalogo')}
      />
    )
  }

  const agotado = plato.estado === 'AGOTADO'

  // El total se calcula en cada render: como estado aparte podría quedar desincronizado de la cantidad.
  const tieneDescuento = plato.descuentoPorcentaje > 0
  const total = plato.precioConDescuento * cantidad
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  const tieneIngredientes = plato.ingredientes.length > 0
  const tieneResenas = resenas.length > 0

  // Promedio de calificaciones (la API no lo manda), a 1 decimal; sin reseñas queda en null para no dividir por 0.
  const promedio = tieneResenas
    ? resenas.reduce((acumulado, resena) => acumulado + resena.calificacion, 0) / resenas.length
    : null
  const promedioTexto = promedio === null
    ? ''
    : (Math.round(promedio * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1 })

  return (
    <>
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <Gallery images={plato.imagenesUrls} title={plato.nombre} />
      <div>
        {agotado && <span className="badge badge-dark mb-3">Agotado</span>}
        <h1 className="font-display text-headline-lg text-primary">{plato.nombre}</h1>
        {tieneResenas && (
          <p className="mt-2 text-label-md text-primary">
            ★ {promedioTexto}{' '}
            <span className="font-normal text-on-surface-variant">
              ({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </p>
        )}
        <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">{plato.descripcion}</p>

        {/* Precio con descuento destacado; el base tachado y el badge solo si hay descuento */}
        <div className="mt-6 border-t border-hairline pt-6">
          <p className="text-body-sm text-on-surface-variant">Precio</p>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-price-lg tabular text-primary">{formatear(plato.precioConDescuento)}</span>
            {tieneDescuento && (
              <>
                <span className="text-body-md text-on-surface-variant line-through">{formatear(plato.precio)}</span>
                <span className="badge badge-sand">−{plato.descuentoPorcentaje}%</span>
              </>
            )}
          </p>
        </div>

        {agotado ? (
          <p className="mt-6 text-label-lg text-on-surface-variant">
            Este plato está agotado por hoy. Volvé más tarde o mirá otros platos del catálogo.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantityStepper value={cantidad} min={1} max={plato.stockDisponible} onChange={setCantidad} />
            <span className="text-body-sm text-on-surface-variant">Quedan {plato.stockDisponible} hoy</span>
          </div>
        )}

        <div className="mt-6">
          <Button
            disabled={agotado}
            onClick={() => onAdd(plato, cantidad)}
          >
            {agotado ? 'Agotado' : `Agregar a la cesta · ${formatear(total)}`}
          </Button>
        </div>
      </div>
    </div>

    {/* TODO(backend): nombre, apellido y nacionalidad del chef; el perfil público solo trae especialidad, foto y textos. */}
    {perfilChef !== null && (
      <section className="mt-16" aria-labelledby="h-chef">
        <h2 id="h-chef" className="font-display text-headline-md text-primary">Quién lo cocina</h2>
        <ul className="mt-6 max-w-2xl">
          <ChefCard chef={perfilChef} />
        </ul>
      </section>
    )}

    {tieneIngredientes && (
      <div className="mt-16">
        <IngredientTrace items={plato.ingredientes} />
      </div>
    )}
    {tieneResenas && (
      <div className="mt-16">
        <ReviewList reviews={resenas} />
      </div>
    )}
    </>
  )
}

export default DetallePlato

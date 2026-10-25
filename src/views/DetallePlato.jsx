// Vista de detalle de un plato (ruta /plato/:id). Se abre desde las tarjetas del catálogo y del inicio.
// Pide el plato y sus reseñas al backend (GET /platos/{id} y GET /resenas/plato/{id}).
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

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

// Lee la respuesta del backend; se usa como .then(leerRespuesta). fetch NO manda los errores HTTP al
// .catch(), por eso revisamos response.ok: si falló lanza un Error con el message y el status del backend.
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
//  - onAdd: función (plato, cantidad) de App. La vista solo avisa "quiero agregar esto"; App decide si se puede.
function DetallePlato({ onAdd }) {
  // useParams devuelve los parámetros de la URL: para /plato/3, { id: '3' }. Ojo: el valor es un STRING.
  const { id } = useParams()

  // useNavigate devuelve una función para cambiar de ruta desde el código (en vez de window.location).
  const navigate = useNavigate()

  // Estado: cuántas porciones quiere el usuario. Vive ACÁ y no en QuantityStepper porque el botón de
  // agregar y el precio también necesitan saber la cantidad. Los hooks van siempre ANTES de cualquier return.
  const [cantidad, setCantidad] = useState(1)

  // ESTADOS de los datos que llegan del backend. Arrancan vacíos y se llenan cuando responde la API.
  //  - plato: el plato (null hasta que llega)
  //  - resenas: las reseñas de ese plato
  //  - noDisponible: true si el backend respondió 404 (el plato no existe o está pausado)
  const [plato, setPlato] = useState(null)
  const [resenas, setResenas] = useState([])
  const [noDisponible, setNoDisponible] = useState(false)

  // El id viene de la URL como texto. Si no es un número entero positivo (por ejemplo /plato/abc),
  // ni siquiera le preguntamos al backend: respondería con un error 500 y no hay nada que mostrar.
  const idValido = Number.isInteger(Number(id)) && Number(id) > 0

  // ESTADOS de carga y error. cargando arranca en true solo si vamos a pedir el plato (id válido).
  const [cargando, setCargando] = useState(idValido)
  const [error, setError] = useState(null)

  // Pide el plato y sus reseñas al abrir la vista, y de nuevo si cambia el id. Ruta pública: NO mandamos el token.
  useEffect(() => {
    // Con un id inválido no hay nada que pedir.
    if (!idValido) {
      return
    }

    // AbortController permite cancelar el pedido si salimos de la vista antes de que responda.
    const controlador = new AbortController()

    fetch(`${API_URL}/platos/${id}`, { signal: controlador.signal })
      .then(leerRespuesta)
      // Devolvemos la promesa del segundo fetch para que el siguiente .then() espere su resultado.
      // Las reseñas se piden después porque, si el plato no existe, ya cortamos con el 404.
      .then((platoApi) =>
        fetch(`${API_URL}/resenas/plato/${id}`, { signal: controlador.signal })
          .then(leerRespuesta)
          .then((resenasApi) => ({ platoApi, resenasApi }))
      )
      .then(({ platoApi, resenasApi }) => {
        setPlato(platoApi)
        // La API devuelve data: null cuando no hay reseñas; ?? [] lo convierte en lista vacía.
        setResenas(resenasApi ?? [])
        setNoDisponible(false)
        setError(null)
        setCargando(false)
      })
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error.
        if (fallo.name === 'AbortError') {
          return
        }
        // 404 = el plato no existe o no está publicado: no es una falla, es "no disponible".
        if (fallo.status === 404) {
          setNoDisponible(true)
        } else {
          // Sin status, ni siquiera llegamos al servidor (apagado o bloqueado).
          setError(
            fallo.status === undefined
              ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
              : fallo.message
          )
        }
        setCargando(false)
      })

    // Función de limpieza: React la ejecuta al salir de la vista o antes de volver a correr el efecto.
    return () => controlador.abort()
  }, [id, idValido])

  // Renderizado condicional: según el estado mostramos una cosa u otra y cortamos acá.
  // Los hooks (useState, useEffect) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando el plato..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Si el id no es válido o el backend dijo 404, mostramos "Este plato no está disponible".
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

  // El plato está agotado cuando la API lo marca con estado AGOTADO (se calcula, no se guarda).
  const agotado = plato.estado === 'AGOTADO'

  // VALORES CALCULADOS a partir del estado (cantidad): si el total fuera otro useState, podría quedar
  // desincronizado. Calculado en cada render, siempre es coherente.
  const tieneDescuento = plato.descuentoPorcentaje > 0
  const total = plato.precioConDescuento * cantidad
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // Solo mostramos cada sección si hay datos (lista vacía -> no se dibuja).
  const tieneIngredientes = plato.ingredientes.length > 0
  const tieneResenas = resenas.length > 0

  // PROMEDIO de las calificaciones (la API NO lo manda): reduce las suma y se divide por la cantidad;
  // Math.round(x * 10) / 10 redondea a 1 decimal. Sin reseñas no dividimos (daría NaN): queda en null.
  const promedio = tieneResenas
    ? resenas.reduce((acumulado, resena) => acumulado + resena.calificacion, 0) / resenas.length
    : null
  const promedioTexto = promedio === null
    ? ''
    : (Math.round(promedio * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1 })

  return (
    <>
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      {/* Gallery recibe las fotos y el título por props; el estado vive adentro suyo */}
      <Gallery images={plato.imagenesUrls} title={plato.nombre} />
      <div>
        {/* Un plato agotado se indica arriba de todo con un badge, además del mensaje y el botón */}
        {agotado && <span className="badge badge-dark mb-3">Agotado</span>}
        <h1 className="font-display text-headline-lg text-primary">{plato.nombre}</h1>
        {/* Renderizado condicional: el promedio solo aparece si hay reseñas */}
        {tieneResenas && (
          <p className="mt-2 text-label-md text-primary">
            ★ {promedioTexto}{' '}
            <span className="font-normal text-on-surface-variant">
              ({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </p>
        )}
        <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">{plato.descripcion}</p>

        {/* Precio con descuento destacado; el precio base tachado y el badge solo si hay descuento */}
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
            {/* Props hacia abajo: value y max. Función hacia arriba: onChange.
                Cuando el stepper la llama con un número nuevo, setCantidad lo guarda
                y React vuelve a dibujar la vista con la cantidad actualizada. */}
            <QuantityStepper value={cantidad} min={1} max={plato.stockDisponible} onChange={setCantidad} />
            <span className="text-body-sm text-on-surface-variant">Quedan {plato.stockDisponible} hoy</span>
          </div>
        )}

        {/* Sin stock el botón queda deshabilitado. Al tocarlo, llamamos a onAdd (la función del
            padre) con el plato y la cantidad elegida. */}
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

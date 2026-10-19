// Vista de detalle de un plato (ruta /plato/:id). Se abre desde las tarjetas del catálogo.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import Gallery from '../components/Gallery'
import QuantityStepper from '../components/QuantityStepper'
import IngredientTrace from '../components/IngredientTrace'
import ReviewList from '../components/ReviewList'
import PLATOS_EJEMPLO from '../data/platosEjemplo'
import RESENAS_EJEMPLO from '../data/resenasEjemplo'

// Props:
//  - onAdd: función (platoId, cantidad) que viene de App. La vista solo avisa "quiero agregar
//    esto"; App decide si se puede (stock) y muestra el aviso. Así la vista no sabe de reglas.
function DetallePlato({ onAdd }) {
  // useParams es un hook de react-router: devuelve un objeto con los parámetros
  // de la URL. Para /plato/3 devuelve { id: '3' }. Ojo: el valor es un STRING.
  const { id } = useParams()

  // useNavigate devuelve una función para cambiar de ruta desde el código
  // (lo usamos en vez de window.location, que está prohibido).
  const navigate = useNavigate()

  // Estado: cuántas porciones quiere el usuario. Arranca en 1.
  // Vive ACÁ (en el padre) y no en QuantityStepper porque más adelante el botón
  // de agregar y el precio también necesitan saber la cantidad.
  // Los hooks siempre se llaman ANTES de cualquier return: React exige que se
  // ejecuten en el mismo orden en cada render.
  const [cantidad, setCantidad] = useState(1)

  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en "no
  // cargando" y "sin error". El setter (setCargando / setError) se agrega en el paso 12.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // .find() recorre el array y devuelve el PRIMER plato que cumple la condición
  // (o undefined si ninguno). Number(id) pasa '3' a 3: con === '3' y 3 no son
  // iguales porque tienen distinto tipo, y nunca encontraríamos el plato.
  // TEMPORAL: cuando conectemos el backend, esto será un pedido a /plato/:id.
  const plato = PLATOS_EJEMPLO.find((p) => p.id === Number(id))

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  if (cargando) {
    return <LoadingState message="Cargando el plato..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Si el id no existe mostramos "Este plato no está disponible". Equivale al 404 de la API
  // (GET /platos/{id} responde 404 si el plato no existe o está pausado).
  if (plato === undefined) {
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

  // VALORES CALCULADOS a partir del estado (cantidad). Si guardáramos el total en otro
  // useState habría que acordarse de actualizarlo cada vez que cambia la cantidad: dos datos
  // que pueden quedar desincronizados. Calculado en cada render, siempre es coherente.
  const tieneDescuento = plato.descuentoPorcentaje > 0
  const total = plato.precioConDescuento * cantidad
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // Las reseñas son un recurso aparte en la API (GET /resenas/plato/{id}); acá filtramos las de
  // este plato. filter devuelve un array nuevo con las que cumplen la condición.
  // TEMPORAL: en el paso 12 se piden al backend.
  const resenas = RESENAS_EJEMPLO.filter((resena) => resena.platoId === plato.id)

  // Solo mostramos cada sección si hay datos (lista vacía -> no se dibuja).
  const tieneIngredientes = plato.ingredientes.length > 0
  const tieneResenas = resenas.length > 0

  // PROMEDIO de las calificaciones. La API NO lo manda: se calcula acá a partir de las reseñas.
  // reduce suma todas las calificaciones y se divide por la cantidad. Math.round(x * 10) / 10 lo
  // redondea a 1 decimal; toLocaleString lo muestra con coma (4,5), como en Argentina.
  // Si no hay reseñas no dividimos (dividir por 0 daría NaN): el promedio queda en null.
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
            padre) con el id del plato y la cantidad elegida. */}
        <div className="mt-6">
          <Button
            disabled={agotado}
            onClick={() => onAdd(plato.id, cantidad)}
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

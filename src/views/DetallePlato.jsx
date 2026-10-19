// Vista de detalle de un plato (ruta /plato/:id). Se abre desde las tarjetas del catálogo.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
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

  // .find() recorre el array y devuelve el PRIMER plato que cumple la condición
  // (o undefined si ninguno). Number(id) pasa '3' a 3: con === '3' y 3 no son
  // iguales porque tienen distinto tipo, y nunca encontraríamos el plato.
  // TEMPORAL: cuando conectemos el backend, esto será un pedido a /plato/:id.
  const plato = PLATOS_EJEMPLO.find((p) => p.id === Number(id))

  // Renderizado condicional: si no hay plato, mostramos este mensaje y cortamos acá.
  if (plato === undefined) {
    return (
      <div className="py-10">
        <h1 className="font-display text-headline-lg text-primary">Plato no encontrado</h1>
        <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
          No existe ningún plato con el código {id}. Puede que ya no esté disponible.
        </p>
        <div className="mt-8">
          <Button onClick={() => navigate('/catalogo')}>Volver al catálogo</Button>
        </div>
      </div>
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

  return (
    <>
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      {/* Gallery recibe las fotos y el título por props; el estado vive adentro suyo */}
      <Gallery images={plato.imagenesUrls} title={plato.nombre} />
      <div>
        <h1 className="font-display text-headline-lg text-primary">{plato.nombre}</h1>
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
          <p className="mt-6 text-label-lg text-on-surface-variant">Agotado hoy</p>
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
            Agregar al carrito · {formatear(total)}
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

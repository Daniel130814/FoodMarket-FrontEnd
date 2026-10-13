// Vista de detalle de un plato (ruta /plato/:id). Se abre desde las tarjetas del catálogo.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Gallery from '../components/Gallery'
import QuantityStepper from '../components/QuantityStepper'
import PortionPicker from '../components/PortionPicker'
import IngredientTrace from '../components/IngredientTrace'
import ReviewList from '../components/ReviewList'
import { useCart } from '../context/CartContext'
import PLATOS_EJEMPLO from '../data/platosEjemplo'

function DetallePlato() {
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

  // agregar viene del contexto del carrito (compartido con el Header y la vista Carrito)
  const { agregar } = useCart()

  // Estado: id de la porción elegida. Guardamos SOLO el id; el precio no se guarda
  // aparte, se calcula más abajo a partir de este id.
  const [porcionId, setPorcionId] = useState('individual')

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

  // Sin stock el plato está agotado (se calcula, no se guarda).
  const agotado = plato.stock === 0

  // VALORES CALCULADOS a partir del estado (porcionId y cantidad). Si guardáramos
  // el precio en otro useState habría que acordarse de actualizarlo cada vez que
  // cambia la porción: dos datos que pueden quedar desincronizados. Calculado en
  // cada render, siempre es coherente.
  const porcion = plato.portions.find((p) => p.id === porcionId)
  const precioAnterior =
    plato.discountPercent > 0 ? Math.round(porcion.price / (1 - plato.discountPercent / 100)) : null
  // Total del botón: usa el precio Individual (plato.price) porque así lo cuenta el carrito.
  const total = plato.price * cantidad
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // No todos los platos de ejemplo traen ingredientes o reseñas: solo mostramos
  // cada sección si hay datos (undefined o lista vacía -> no se dibuja).
  const tieneIngredientes = plato.ingredients !== undefined && plato.ingredients.length > 0
  const tieneResenas = plato.reviews !== undefined && plato.reviews.length > 0

  return (
    <>
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      {/* Gallery recibe las fotos y el título por props; el estado vive adentro suyo */}
      <Gallery images={plato.images} title={plato.title} />
      <div>
        <h1 className="font-display text-headline-lg text-primary">{plato.title}</h1>
        <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">{plato.description}</p>

        <div className="mt-6">
          <PortionPicker options={plato.portions} value={porcionId} onChange={setPorcionId} />
        </div>

        {/* Precio de la porción elegida; tachado y badge solo si hay descuento */}
        <div className="mt-6 border-t border-hairline pt-6">
          <p className="text-body-sm text-on-surface-variant">Precio</p>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-price-lg tabular text-primary">{formatear(porcion.price)}</span>
            {precioAnterior !== null && (
              <>
                <span className="text-body-md text-on-surface-variant line-through">{formatear(precioAnterior)}</span>
                <span className="badge badge-sand">−{plato.discountPercent}%</span>
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
            <QuantityStepper value={cantidad} min={1} max={plato.stock} onChange={setCantidad} />
            <span className="text-body-sm text-on-surface-variant">Quedan {plato.stock} hoy</span>
          </div>
        )}

        {/* Sin stock el botón queda deshabilitado. Al tocarlo, agregar() del contexto suma el plato
            al carrito. El carrito no guarda la porción: siempre cuenta el precio Individual. */}
        <div className="mt-6">
          <Button
            disabled={agotado}
            onClick={() => agregar(plato, cantidad)}
          >
            Agregar al carrito · {formatear(total)}
          </Button>
        </div>
      </div>
    </div>

    {tieneIngredientes && (
      <div className="mt-16">
        <IngredientTrace items={plato.ingredients} />
      </div>
    )}
    {tieneResenas && (
      <div className="mt-16">
        <ReviewList reviews={plato.reviews} />
      </div>
    )}
    </>
  )
}

export default DetallePlato

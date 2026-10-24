import { Link } from 'react-router-dom'
import Button from '../comunes/Button'

// Tarjeta de un plato (catálogo e inicio). Componente "tonto": solo recibe props y dibuja.
// Props:
//  - dish: el plato a mostrar, con la forma de PlatoResponse de la API
//    { id, nombre, descripcion, imagenesUrls, precio, descuentoPorcentaje, precioConDescuento,
//      stockDisponible, estado, chefNombre, ... }
//  - onAdd: función (plato, cantidad) que viene del padre. La tarjeta no sabe qué pasa al
//    agregar (stock, aviso): solo avisa "quiero agregar este plato" y le pasa el plato entero.
function PlatoCard({ dish, onAdd }) {
  // Desestructuración: sacamos del plato solo los campos que usa la tarjeta.
  const { id, nombre, descripcion, imagenesUrls, precio, descuentoPorcentaje, precioConDescuento, stockDisponible, estado, chefNombre } = dish

  // El estado visual sale del estado que manda la API: AGOTADO = sin stock.
  const state = estado === 'AGOTADO' ? 'soldout' : stockDisponible <= 5 ? 'low' : 'available'
  // Hay descuento si el porcentaje es mayor a 0: entonces mostramos el precio base tachado.
  const tieneDescuento = descuentoPorcentaje > 0
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <article className="dish flex flex-col" data-state={state}>
      {/* Link navega sin recargar la página; el id del plato arma la URL */}
      <Link
        to={`/plato/${id}`}
        className="dish__media relative block aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[4/5] bg-surface-container"
      >
        {/* Renderizado condicional: la API puede devolver un plato sin imágenes. En ese caso
            mostramos un ícono en lugar de una imagen rota. */}
        {imagenesUrls.length > 0 ? (
          <img src={imagenesUrls[0]} alt={nombre} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-on-surface-variant" aria-hidden="true">
            <span className="material-symbols-outlined text-[48px]">restaurant</span>
          </span>
        )}
        {state === 'soldout' && (
          <span className="badge badge-dark absolute left-3 top-3">Agotado</span>
        )}
      </Link>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        {/* TODO(backend): chefNombre en los platos. La API todavía solo trae chefId, así que si no
            viene el nombre no dibujamos nada. */}
        {chefNombre !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-label-md text-on-surface-variant">{chefNombre}</span>
          </div>
        )}
        <h3 className="dish__title font-display text-title-md text-primary">
          <Link to={`/plato/${id}`}>{nombre}</Link>
        </h3>
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">{descripcion}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-price-md tabular text-primary">{formatear(precioConDescuento)}</span>
              {tieneDescuento && (
                <>
                  <span className="text-body-sm text-on-surface-variant line-through">{formatear(precio)}</span>
                  <span className="badge badge-sand">−{descuentoPorcentaje}%</span>
                </>
              )}
            </p>
            {state === 'low' && <p className="text-label-sm">Quedan {stockDisponible} hoy</p>}
            {state === 'soldout' && <p className="text-label-sm">Agotado hoy</p>}
          </div>
          <Button disabled={state === 'soldout'} onClick={() => onAdd(dish, 1)}>Agregar</Button>
        </div>
      </div>
    </article>
  )
}

export default PlatoCard

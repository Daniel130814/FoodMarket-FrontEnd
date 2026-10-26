// Una línea del carrito: nombre, selector de cantidad y botón Quitar.
import QuantityStepper from './QuantityStepper'

// Tope del selector: la API no manda el stock en los ítems, así que si se lo supera el backend responde 400 y App lo avisa.
const CANTIDAD_MAXIMA = 99

// Props: item (ítem del carrito de la API), imagenUrl (foto del plato o undefined), onQuantityChange (itemId, cantidad), onRemove (itemId).
function CartItem({ item, imagenUrl, onQuantityChange, onRemove }) {
  const { id, nombrePlato, cantidad, precioBase, descuentoPorcentaje, precioUnitarioActual, subtotalEstimado } = item
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      {/* TODO(backend): stockDisponible y chefNombre en los ítems del carrito. Sin foto se muestra un ícono. */}
      {imagenUrl === undefined ? (
        <div
          className="grid h-20 w-20 flex-none place-items-center rounded-md bg-surface-container text-on-surface-variant sm:h-[104px] sm:w-[104px]"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[32px]">restaurant</span>
        </div>
      ) : (
        <img src={imagenUrl} alt="" className="h-20 w-20 flex-none rounded-md object-cover sm:h-[104px] sm:w-[104px]" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-title-md text-primary">{nombrePlato}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Avisa con el id del ítem, no del plato */}
          <QuantityStepper
            value={cantidad}
            min={1}
            max={CANTIDAD_MAXIMA}
            onChange={(nueva) => onQuantityChange(id, nueva)}
          />
          <p className="font-display text-price-md tabular text-primary">{formatear(subtotalEstimado)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-body-sm tabular text-on-surface-variant">{formatear(precioUnitarioActual)} c/u</p>
            {descuentoPorcentaje > 0 && (
              <>
                <p className="text-body-sm tabular text-on-surface-variant line-through">{formatear(precioBase)}</p>
                <span className="badge badge-sand">−{descuentoPorcentaje}%</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-sm !px-2 text-error"
            onClick={() => onRemove(id)}
            aria-label={`Quitar ${nombrePlato} del carrito`}
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>Quitar
          </button>
        </div>
      </div>
    </li>
  )
}

export default CartItem

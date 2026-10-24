// Una línea del carrito: nombre, selector de cantidad y botón Quitar. Se usa en views/Carrito.
import QuantityStepper from './QuantityStepper'

// Tope del selector de cantidad. La API no manda el stock en los ítems del carrito, así que el
// selector no conoce el stock real; App rechaza (con un aviso) lo que supere el stock.
// TODO (paso 12): en producción el backend responde 400 si no hay stock suficiente.
const CANTIDAD_MAXIMA = 99

// Props:
//  - item: ítem del carrito con la forma de la API
//    { id, platoId, nombrePlato, cantidad, precioBase, descuentoPorcentaje, precioUnitarioActual, subtotalEstimado }
//  - onQuantityChange: función (itemId, nuevaCantidad) que sube el cambio al padre
//  - onRemove: función (itemId) que pide quitar el ítem
function CartItem({ item, onQuantityChange, onRemove }) {
  const { id, nombrePlato, cantidad, precioBase, descuentoPorcentaje, precioUnitarioActual, subtotalEstimado } = item
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      {/* TODO(backend): imagenUrl, stockDisponible y chefNombre en los ítems del carrito; usamos un placeholder.
          En el paso 12 se puede buscar la foto con GET /platos/{platoId}. */}
      <div
        className="grid h-20 w-20 flex-none place-items-center rounded-md bg-surface-container text-on-surface-variant sm:h-[104px] sm:w-[104px]"
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[32px]">restaurant</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-title-md text-primary">{nombrePlato}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Mismo QuantityStepper del detalle. Al cambiar, avisa con el id del ÍTEM (no del plato) */}
          <QuantityStepper
            value={cantidad}
            min={1}
            max={CANTIDAD_MAXIMA}
            onChange={(nueva) => onQuantityChange(id, nueva)}
          />
          {/* Total de la línea: lo calcula App (subtotalEstimado), acá solo se muestra */}
          <p className="font-display text-price-md tabular text-primary">{formatear(subtotalEstimado)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-body-sm tabular text-on-surface-variant">{formatear(precioUnitarioActual)} c/u</p>
            {/* Renderizado condicional: solo si el plato tiene descuento mostramos el precio base tachado */}
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

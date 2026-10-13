// Una línea del carrito: foto, nombre, selector de cantidad y botón Quitar. Se usa en CartGroup.
import QuantityStepper from './QuantityStepper'

// Props:
//  - item: { plato, cantidad }
//  - onQuantityChange: función (platoId, nuevaCantidad) que sube el cambio al padre
//  - onRemove: función (platoId) que pide quitar el ítem
function CartItem({ item, onQuantityChange, onRemove }) {
  const { plato, cantidad } = item
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <img
        src={plato.images[0]}
        alt={plato.title}
        className="h-20 w-20 flex-none rounded-md object-cover sm:h-[104px] sm:w-[104px]"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-title-md text-primary">{plato.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{plato.description}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Mismo QuantityStepper del detalle: min 1, max = stock. Al cambiar, avisa con el id del plato */}
          <QuantityStepper
            value={cantidad}
            min={1}
            max={plato.stock}
            onChange={(nueva) => onQuantityChange(plato.id, nueva)}
          />
          {/* Total de la línea: se calcula, no se guarda */}
          <p className="font-display text-price-md tabular text-primary">{formatear(plato.price * cantidad)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-body-sm tabular text-on-surface-variant">{formatear(plato.price)} c/u</p>
            {/* Renderizado condicional: solo cuando se llegó al tope de stock */}
            {cantidad === plato.stock && (
              <p className="text-label-sm text-on-tertiary-fixed-variant">Es el máximo disponible hoy</p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-sm !px-2 text-error"
            onClick={() => onRemove(plato.id)}
            aria-label={`Quitar ${plato.title} del carrito`}
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>Quitar
          </button>
        </div>
      </div>
    </li>
  )
}

export default CartItem

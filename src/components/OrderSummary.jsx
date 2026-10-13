// Resumen del pedido: platos, envío y total. Se usa en views/Carrito.
import Button from './Button'

// Props:
//  - units: cantidad total de porciones
//  - subtotal: suma de los platos
//  - shipping: costo de envío
//  - onConfirm: función que se llama al tocar "Confirmar pedido"
function OrderSummary({ units, subtotal, shipping, onConfirm }) {
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // El total se calcula acá a partir de lo que recibe; no se guarda en ningún estado
  const total = subtotal + shipping

  return (
    <aside className="lg:sticky lg:top-[100px]" aria-labelledby="h-res">
      <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7">
        <h2 id="h-res" className="font-display text-headline-sm text-primary">Resumen</h2>
        <dl className="mt-5 space-y-3 text-body-md">
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Platos ({units})</dt>
            <dd className="tabular text-primary">{formatear(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Envío térmico</dt>
            <dd className="tabular text-primary">{formatear(shipping)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-hairline pt-5">
          <div>
            <p className="text-label-lg text-primary">Total</p>
            <p className="text-body-sm text-on-surface-variant">Impuestos incluidos</p>
          </div>
          <p className="font-display text-price-lg tabular text-primary">{formatear(total)}</p>
        </div>
        <div className="mt-7">
          <Button onClick={onConfirm}>Confirmar pedido · {formatear(total)}</Button>
        </div>
      </div>
    </aside>
  )
}

export default OrderSummary

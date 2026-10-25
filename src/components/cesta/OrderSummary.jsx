// Resumen del pedido: platos, envío y total.
import Button from '../comunes/Button'

// Props: units (porciones), subtotal, shipping, onConfirm, buttonLabel (Cesta o Checkout), disabled (por ejemplo, sin domicilio elegido).
function OrderSummary({ units, subtotal, shipping, onConfirm, buttonLabel = 'Confirmar pedido', disabled = false }) {
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

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
          <Button onClick={onConfirm} disabled={disabled}>{buttonLabel} · {formatear(total)}</Button>
        </div>
      </div>
    </aside>
  )
}

export default OrderSummary

import Button from './Button'

function PlatoCard({ dish }) {
  const { title, description, images, price, discountPercent, stock, seller } = dish

  const state = stock === 0 ? 'soldout' : stock <= 5 ? 'low' : 'available'
  const oldPrice = discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : null
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <article className="dish flex flex-col" data-state={state}>
      <div className="dish__media relative block aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[4/5] bg-surface-container">
        <img src={images[0]} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <span className="truncate text-label-md text-on-surface-variant">{seller.name}</span>
        <h3 className="dish__title font-display text-title-md text-primary">{title}</h3>
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">{description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="font-display text-price-md tabular text-primary">{formatear(price)}</p>
            {oldPrice !== null && (
              <p className="text-label-sm text-on-surface-variant line-through">{formatear(oldPrice)}</p>
            )}
            {state === 'low' && <p className="text-label-sm">Quedan {stock} hoy</p>}
            {state === 'soldout' && <p className="text-label-sm">Agotado hoy</p>}
          </div>
          <Button disabled={state === 'soldout'}>Agregar</Button>
        </div>
      </div>
    </article>
  )
}

export default PlatoCard

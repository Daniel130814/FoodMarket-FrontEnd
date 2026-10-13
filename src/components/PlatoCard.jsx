import { Link } from 'react-router-dom'
import Button from './Button'

function PlatoCard({ dish }) {
  const { id, title, description, images, price, discountPercent, stock, seller, rating, reviewsCount } = dish

  const state = stock === 0 ? 'soldout' : stock <= 5 ? 'low' : 'available'
  const oldPrice = discountPercent > 0 ? Math.round(price / (1 - discountPercent / 100)) : null
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <article className="dish flex flex-col" data-state={state}>
      {/* Link navega sin recargar la página; el id del plato arma la URL */}
      <Link
        to={`/plato/${id}`}
        className="dish__media relative block aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[4/5] bg-surface-container"
      >
        <img src={images[0]} alt={title} className="h-full w-full object-cover" />
        {state === 'soldout' && (
          <span className="badge badge-dark absolute left-3 top-3">Agotado hoy</span>
        )}
      </Link>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-label-md text-on-surface-variant">{seller.name}</span>
          {rating > 0 && (
            <span className="text-label-md text-primary">
              ★ {rating} <span className="font-normal text-on-surface-variant">({reviewsCount})</span>
            </span>
          )}
        </div>
        <h3 className="dish__title font-display text-title-md text-primary">
          <Link to={`/plato/${id}`}>{title}</Link>
        </h3>
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">{description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-price-md tabular text-primary">{formatear(price)}</span>
              {oldPrice !== null && (
                <>
                  <span className="text-body-sm text-on-surface-variant line-through">{formatear(oldPrice)}</span>
                  <span className="badge badge-sand">−{discountPercent}%</span>
                </>
              )}
            </p>
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

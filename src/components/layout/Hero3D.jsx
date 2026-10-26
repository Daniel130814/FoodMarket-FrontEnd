// Hero de la home con efecto 3D solo de CSS (clases .hero-3d* en index.css): foto en arco, capas y la tarjeta de un plato real.
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Foto de respaldo, la del diseño de referencia: se usa si el plato no tiene imágenes.
const FOTO_PORTADA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANhvv19i3bO8CZOGjtiv3eGepjcPg20Cxpm7L-atqFfTNCG76iLDbt8QwIEjAQv9EnTFr3FB65DzsJbm18gpLKJumkzw1Q0vw-gY7YtCDrV9_c79Fi339vRxkoEPksZlx9nURqHS14P1r20LceaBdYx8VBLO2-1ieJ9xH6NNPOUpQGUsZwm5LnyBOLAJKE7QzxP4VBS8cVmRw1kzaTHo5ftnWBSkOdm5ysZesa8HjUQhnhBWWMQC36'

// Props: plato (PlatoResponse o undefined si no hay; su foto y su tarjeta van adelante), onAdd (plato, cantidad).
function Hero3D({ plato, onAdd }) {
  // true si la foto no cargó: se muestra un ícono en su lugar.
  const [fotoRota, setFotoRota] = useState(false)

  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // Foto del plato (la primera) o la de respaldo; sin stock, la tarjeta sigue pero no se puede agregar.
  const foto = plato?.imagenesUrls?.[0] ?? FOTO_PORTADA
  const agotado = plato !== undefined && (plato.estado === 'AGOTADO' || plato.stockDisponible === 0)

  return (
    <div className="hero-3d relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div className="hero-3d__float">
        <div className="hero-3d__scene relative lg:ml-auto lg:max-w-[460px]">
          {/* Capa de atrás (decoración) */}
          <div
            className="hero-3d__back absolute inset-0 rounded-t-full rounded-b-xl border-2 border-hairline bg-surface-container-high"
            aria-hidden="true"
          />

          {/* Capa del medio: la foto en arco */}
          <div className="relative aspect-square overflow-hidden rounded-t-full rounded-b-xl bg-surface-container shadow-lift sm:aspect-[4/5]">
            {fotoRota ? (
              <span className="grid h-full w-full place-items-center text-primary" aria-hidden="true">
                <span className="material-symbols-outlined text-[72px]">restaurant</span>
              </span>
            ) : (
              <img
                src={foto}
                alt={plato === undefined ? 'Plato de autor recién cocinado' : plato.nombre}
                onError={() => setFotoRota(true)}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Capa de adelante (decoración): un círculo */}
          <span
            className="hero-3d__orb absolute right-2 top-[18%] lg:-right-3 h-14 w-14 rounded-full bg-secondary-fixed shadow-lift"
            aria-hidden="true"
          />

          {/* Capa de adelante: la tarjeta de un plato real, solo si hay uno */}
          {plato !== undefined && (
            <div className="hero-3d__front mt-4 flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-lift lg:absolute lg:-left-6 lg:bottom-12 lg:mt-0 lg:w-[290px]">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-label-sm text-on-tertiary-fixed-variant">
                  <span className="dot" aria-hidden="true" />
                  Plato recomendado de hoy
                </p>
                <Link to={`/plato/${plato.id}`} className="mt-1 block truncate font-display text-[18px] leading-6 text-primary">
                  {plato.nombre}
                </Link>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-body-sm text-on-surface-variant">
                  <span className="tabular font-display text-[16px] text-primary">{formatear(plato.precioConDescuento)}</span>
                  {agotado ? 'Agotado por hoy' : `Quedan ${plato.stockDisponible} hoy`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-icon"
                aria-label={`Agregar ${plato.nombre} a la cesta`}
                disabled={agotado}
                onClick={() => onAdd(plato, 1)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Hero3D

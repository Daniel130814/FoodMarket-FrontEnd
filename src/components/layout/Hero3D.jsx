// Imagen del hero de la home con efecto 3D hecho solo con CSS: una foto en arco, flotando y girando apenas,
// con una tarjeta de un plato real "delante" y otra capa "detrás". Se usa en views/Inicio.
// Las clases .hero-3d* están en index.css (perspectiva, capas a distintas profundidades y animación).
import { useState } from 'react'

// Foto del plato de portada (ravioli de ricotta y hongos), la misma del diseño de referencia.
const FOTO_PORTADA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANhvv19i3bO8CZOGjtiv3eGepjcPg20Cxpm7L-atqFfTNCG76iLDbt8QwIEjAQv9EnTFr3FB65DzsJbm18gpLKJumkzw1Q0vw-gY7YtCDrV9_c79Fi339vRxkoEPksZlx9nURqHS14P1r20LceaBdYx8VBLO2-1ieJ9xH6NNPOUpQGUsZwm5LnyBOLAJKE7QzxP4VBS8cVmRw1kzaTHo5ftnWBSkOdm5ysZesa8HjUQhnhBWWMQC36'

// Props:
//  - plato: un plato con la forma de PlatoResponse de la API, o undefined si todavía no hay (cargando o sin
//    platos). Se muestra en la tarjeta que flota delante de la foto.
//  - onAdd: función (plato, cantidad) de App. El hero no agrega nada: solo avisa "quiero este plato".
function Hero3D({ plato, onAdd }) {
  // ESTADO LOCAL de UI: true si la foto no se pudo cargar. Es propio de este componente: el padre no necesita
  // saberlo. Si falla, mostramos un fondo con un ícono en lugar de la imagen.
  const [fotoRota, setFotoRota] = useState(false)

  // Importe en pesos con separadores argentinos, igual que en el resto de la app.
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    // .hero-3d fija la perspectiva (qué tan "cerca" se ve la profundidad); .settle es la entrada del hero.
    <div className="hero-3d settle relative mx-auto w-full max-w-[440px] lg:max-w-none">
      {/* .hero-3d__float hace flotar y girar suavemente todo el conjunto (animación en bucle) */}
      <div className="hero-3d__float">
        {/* .hero-3d__scene se inclina un poco más cuando el mouse pasa por encima */}
        <div className="hero-3d__scene relative lg:ml-auto lg:max-w-[460px]">
          {/* Capa de ATRÁS: un arco más grande, desplazado hacia el fondo. aria-hidden: es solo decoración. */}
          <div
            className="hero-3d__back absolute inset-0 rounded-t-full rounded-b-xl border-2 border-hairline bg-surface-container-high"
            aria-hidden="true"
          />

          {/* Capa del MEDIO: la foto en arco (el único gesto formal fuerte del diseño) */}
          <div className="relative aspect-square overflow-hidden rounded-t-full rounded-b-xl bg-surface-container shadow-lift sm:aspect-[4/5]">
            {/* Renderizado condicional: la foto, o un ícono si no se pudo cargar. onError se dispara cuando
                el navegador no logra cargar la imagen. */}
            {fotoRota ? (
              <span className="grid h-full w-full place-items-center text-primary" aria-hidden="true">
                <span className="material-symbols-outlined text-[72px]">restaurant</span>
              </span>
            ) : (
              <img
                src={FOTO_PORTADA}
                alt="Plato de autor recién cocinado, con manteca tostada y salvia"
                onError={() => setFotoRota(true)}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Capa de ADELANTE (decoración): un círculo que flota por delante de la foto */}
          <span
            className="hero-3d__orb absolute right-2 top-[18%] lg:-right-3 h-14 w-14 rounded-full bg-secondary-fixed shadow-lift"
            aria-hidden="true"
          />

          {/* Capa de ADELANTE: la tarjeta de un plato real de la API. Renderizado condicional: solo si hay un plato. */}
          {plato !== undefined && (
            <div className="hero-3d__front mt-4 flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-lift lg:absolute lg:-left-6 lg:bottom-12 lg:mt-0 lg:w-[290px]">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-label-sm text-on-tertiary-fixed-variant">
                  <span className="dot" aria-hidden="true" />
                  Quedan {plato.stockDisponible} hoy
                </p>
                <p className="mt-1 truncate font-display text-[18px] leading-6 text-primary">{plato.nombre}</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  <span className="tabular font-display text-[16px] text-primary">{formatear(plato.precioConDescuento)}</span>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-icon"
                aria-label={`Agregar ${plato.nombre} a la cesta`}
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

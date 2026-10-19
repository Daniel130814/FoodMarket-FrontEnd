// Una fila de la lista de publicaciones del chef: foto, nombre, estado, precio y stock. Se usa en views/MisPublicaciones.

// Cómo se ve cada estado de la API: el texto y la clase del badge. Es un objeto usado como
// "diccionario": ESTADOS['PAUSADO'] devuelve { etiqueta: 'Pausado', clase: 'badge-sand' }.
const ESTADOS = {
  PUBLICADO: { etiqueta: 'Publicado', clase: 'badge-leaf' },
  AGOTADO: { etiqueta: 'Agotado', clase: 'badge-dark' },
  PAUSADO: { etiqueta: 'Pausado', clase: 'badge-sand' },
  BORRADOR: { etiqueta: 'Borrador', clase: 'badge-mute' },
}

// Props:
//  - plato: el plato con la forma de PlatoResponse de la API
//    { id, nombre, imagenesUrls, precio, descuentoPorcentaje, precioConDescuento, stockDisponible, estado, categorias, ... }
function PublicationRow({ plato }) {
  const { nombre, imagenesUrls, precio, descuentoPorcentaje, precioConDescuento, stockDisponible, estado, categorias } = plato
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`
  const tieneDescuento = descuentoPorcentaje > 0

  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 py-5 md:grid-cols-[88px_minmax(0,1fr)_150px_120px] md:gap-x-6">
      {/* Renderizado condicional: un borrador puede no tener fotos, entonces mostramos un ícono */}
      {imagenesUrls.length > 0 ? (
        <img src={imagenesUrls[0]} alt="" loading="lazy" className="h-[72px] w-[72px] rounded-md object-cover md:h-[88px] md:w-[88px]" />
      ) : (
        <span className="grid h-[72px] w-[72px] place-items-center rounded-md bg-surface-container text-on-surface-variant md:h-[88px] md:w-[88px]" aria-hidden="true">
          <span className="material-symbols-outlined text-[28px]">image</span>
        </span>
      )}
      <div className="min-w-0">
        <h3 className="font-display text-title-md text-primary">{nombre}</h3>
        {/* join une los textos del array con un separador: ['Pastas', 'Carnes'] -> 'Pastas · Carnes' */}
        <p className="text-body-sm text-on-surface-variant">{categorias.join(' · ')}</p>
        <p className="mt-2"><span className={`badge ${ESTADOS[estado].clase}`}>{ESTADOS[estado].etiqueta}</span></p>
      </div>
      <div className="col-span-2 flex items-baseline justify-between gap-3 md:col-span-1 md:block">
        <span className="text-body-sm text-on-surface-variant md:hidden">Precio</span>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-price-md tabular text-primary">{formatear(precioConDescuento)}</span>
          {tieneDescuento && (
            <>
              <span className="text-body-sm tabular text-on-surface-variant line-through">{formatear(precio)}</span>
              <span className="badge badge-sand">−{descuentoPorcentaje}%</span>
            </>
          )}
        </p>
      </div>
      <div className="col-span-2 flex items-baseline justify-between gap-3 md:col-span-1 md:block">
        <span className="text-body-sm text-on-surface-variant md:hidden">Stock</span>
        <p className="text-body-md tabular text-primary">{stockDisponible} {stockDisponible === 1 ? 'porción' : 'porciones'}</p>
      </div>
    </li>
  )
}

export default PublicationRow

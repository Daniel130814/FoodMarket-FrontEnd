// Una fila de la lista de publicaciones del chef (foto, estado, precio, stock y acciones).
import { Link } from 'react-router-dom'
import QuantityStepper from '../cesta/QuantityStepper'

// Estado del plato -> texto y clase del badge.
const ESTADOS = {
  PUBLICADO: { etiqueta: 'Publicado', clase: 'badge-leaf' },
  AGOTADO: { etiqueta: 'Agotado', clase: 'badge-dark' },
  PAUSADO: { etiqueta: 'Pausado', clase: 'badge-sand' },
  BORRADOR: { etiqueta: 'Borrador', clase: 'badge-mute' },
}

const STOCK_MAXIMO = 99

// Props: plato (PlatoResponse), onStockChange (platoId, stock), onTogglePause (platoId), onOpenDiscount (plato),
// onOpenDelete (platoId). La fila no cambia nada por su cuenta: solo avisa.
function PublicationRow({ plato, onStockChange, onTogglePause, onOpenDiscount, onOpenDelete }) {
  const { id, nombre, imagenesUrls, precio, descuentoPorcentaje, precioConDescuento, stockDisponible, estado, categorias } = plato
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`
  const tieneDescuento = descuentoPorcentaje > 0

  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 py-5 md:grid-cols-[88px_minmax(0,1fr)_150px_170px_auto] md:gap-x-6">
      {/* Un borrador puede no tener fotos: se muestra un ícono */}
      {imagenesUrls.length > 0 ? (
        <img src={imagenesUrls[0]} alt="" loading="lazy" className="h-[72px] w-[72px] rounded-md object-cover md:h-[88px] md:w-[88px]" />
      ) : (
        <span className="grid h-[72px] w-[72px] place-items-center rounded-md bg-surface-container text-on-surface-variant md:h-[88px] md:w-[88px]" aria-hidden="true">
          <span className="material-symbols-outlined text-[28px]">image</span>
        </span>
      )}
      <div className="min-w-0">
        <h3 className="font-display text-title-md text-primary">{nombre}</h3>
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
      <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:justify-start">
        <span className="text-body-sm text-on-surface-variant md:hidden">Stock</span>
        {/* Mismo selector del detalle, con mínimo 0: se puede dejar sin stock */}
        <QuantityStepper value={stockDisponible} min={0} max={STOCK_MAXIMO} onChange={(nuevo) => onStockChange(id, nuevo)} />
      </div>
      {/* flex-wrap: en el celular los 4 botones no entran en una línea */}
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-1 border-t border-hairline pt-3 md:col-span-1 md:flex-nowrap md:border-0 md:pt-0">
        <Link to={`/publicar/${id}`} className="btn btn-quiet btn-sm">
          <span className="material-symbols-outlined">edit</span>
          <span className="md:sr-only">Editar</span>
        </Link>
        {/* Un borrador no se pausa ni se reactiva: se publica editándolo */}
        {estado !== 'BORRADOR' && (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => onTogglePause(id)}>
            <span className="material-symbols-outlined">{estado === 'PAUSADO' ? 'play_circle' : 'pause_circle'}</span>
            <span className="md:sr-only">{estado === 'PAUSADO' ? 'Reactivar' : 'Pausar'}</span>
          </button>
        )}
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => onOpenDiscount(plato)}>
          <span className="material-symbols-outlined">sell</span>
          <span className="md:sr-only">Descuento</span>
        </button>
        <button type="button" className="btn btn-quiet btn-sm !text-error" onClick={() => onOpenDelete(id)}>
          <span className="material-symbols-outlined">delete</span>
          <span className="md:sr-only">Eliminar</span>
        </button>
      </div>
    </li>
  )
}

export default PublicationRow

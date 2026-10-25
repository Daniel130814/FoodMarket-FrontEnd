// Galería del detalle del plato: foto principal grande y miniaturas.
import { useState } from 'react'

// Props: images (URLs de las fotos), title (nombre del plato, para el texto alternativo).
function Gallery({ images, title }) {
  // Índice de la foto que se ve grande (arranca en la primera).
  const [activa, setActiva] = useState(0)

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
        {/* Un plato puede no tener fotos (lista vacía): se muestra un ícono */}
        {images.length > 0 ? (
          <img src={images[activa]} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-on-surface-variant" aria-hidden="true">
            <span className="material-symbols-outlined text-[72px]">restaurant</span>
          </span>
        )}
      </div>

      {/* Con una sola foto no hay miniaturas */}
      {images.length > 1 && (
        <div className="scroll-x mt-4 flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Fotos del plato">
          {images.map((url, indice) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiva(indice)}
              aria-label={`Ver foto ${indice + 1} de ${images.length}`}
              aria-current={indice === activa}
              className="h-[72px] w-[72px] flex-none overflow-hidden rounded-md ring-offset-2 ring-offset-surface transition aria-[current=true]:ring-2 aria-[current=true]:ring-primary-container sm:h-20 sm:w-20"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Gallery

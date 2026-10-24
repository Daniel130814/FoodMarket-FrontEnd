// Galería del detalle del plato: foto principal grande + miniaturas. Se usa en views/DetallePlato.
import { useState } from 'react'

// Props:
//  - images: array de URLs de las fotos del plato
//  - title: nombre del plato (para el texto alternativo de las imágenes)
function Gallery({ images, title }) {
  // useState guarda un dato que puede cambiar y hace que React vuelva a dibujar
  // el componente cuando cambia. Devuelve un array de dos cosas:
  //  [0] el valor actual  -> activa (el índice de la foto que se ve grande)
  //  [1] una función      -> setActiva (la única forma de cambiar ese valor)
  // El 0 es el valor inicial: arrancamos mostrando la primera foto.
  const [activa, setActiva] = useState(0)

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
        {/* Renderizado condicional: un plato puede no tener fotos (la API devuelve una lista vacía).
            En ese caso mostramos un ícono en lugar de una imagen rota. */}
        {images.length > 0 ? (
          // La foto grande depende del estado: cambia activa y cambia la imagen
          <img src={images[activa]} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-on-surface-variant" aria-hidden="true">
            <span className="material-symbols-outlined text-[72px]">restaurant</span>
          </span>
        )}
      </div>

      {/* Con una sola foto no tiene sentido mostrar miniaturas */}
      {images.length > 1 && (
        <div className="scroll-x mt-4 flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Fotos del plato">
          {images.map((url, indice) => (
            // La key es la URL: no se repite y no cambia si se reordena la lista.
            <button
              key={url}
              type="button"
              // Al hacer clic llamamos al setter: React guarda el nuevo índice
              // y vuelve a dibujar el componente con la foto nueva.
              onClick={() => setActiva(indice)}
              aria-label={`Ver foto ${indice + 1} de ${images.length}`}
              // aria-current marca la miniatura elegida (el CSS le pone el borde)
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

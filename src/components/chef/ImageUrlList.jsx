// Lista de campos de URL de imágenes, con vista previa y botones para agregar y quitar.
// Se usa en views/PublicarPlato, junto a ImageFilePicker: la API acepta imágenes como URLs de texto y,
// desde el 24/10, también como archivos subidos.
// Componente "tonto": las URLs y las funciones vienen del padre.

// Props:
//  - urls: array de textos, uno por campo (lo guarda el padre con useState)
//  - onChange: función del padre (posición, nuevoTexto); se llama al escribir en un campo
//  - onAdd: función del padre sin argumentos; agrega un campo vacío
//  - onRemove: función del padre (posición); quita ese campo
//  - error: texto del error de las imágenes, o null si no hay
function ImageUrlList({ urls, onChange, onAdd, onRemove, error }) {
  return (
    <fieldset>
      <legend className="label">Imágenes (URL)</legend>
      <ul className="space-y-3">
        {/* map: un campo por URL. Estos campos no tienen un id propio, así que usamos la posición
            (index) como key. Es correcto acá porque los valores son "controlados" por el padre. */}
        {urls.map((url, index) => (
          <li key={index} className="flex items-center gap-3">
            {/* Vista previa: solo si el campo tiene texto */}
            {url.trim() !== '' ? (
              <img src={url} alt={`Vista previa de la imagen ${index + 1}`} className="h-12 w-12 flex-none rounded-md object-cover" />
            ) : (
              <span className="grid h-12 w-12 flex-none place-items-center rounded-md bg-surface-container text-on-surface-variant" aria-hidden="true">
                <span className="material-symbols-outlined">image</span>
              </span>
            )}
            <input
              type="url"
              className="field"
              placeholder="https://..."
              aria-label={`URL de la imagen ${index + 1}`}
              value={url}
              onChange={(event) => onChange(index, event.target.value)}
              aria-invalid={error !== null ? 'true' : 'false'}
            />
            <button type="button" className="btn btn-quiet btn-sm !text-error" onClick={() => onRemove(index)}>
              <span className="material-symbols-outlined">delete</span>
              <span className="sr-only">Quitar imagen {index + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
          <span className="material-symbols-outlined">add</span>Agregar imagen
        </button>
      </div>
      {error !== null && (
        <p className="hint hint--error" role="alert">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}

export default ImageUrlList

// Lista de campos de URL de imágenes, con vista previa y botones para agregar y quitar (convive con ImageFilePicker).

// Props: urls (un texto por campo), onChange (posición, texto), onAdd (agrega un campo vacío), onRemove (posición), error (texto o null).
function ImageUrlList({ urls, onChange, onAdd, onRemove, error }) {
  return (
    <fieldset>
      <legend className="label">Imágenes (URL)</legend>
      <ul className="space-y-3">
        {/* Los campos no tienen id propio: la posición hace de key (válido porque el padre controla los valores) */}
        {urls.map((url, index) => (
          <li key={index} className="flex items-center gap-3">
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

// Selector de imágenes desde el equipo del chef. No sube ni valida nada: el padre guarda la lista y los sube al guardar.

// Props: archivos (File[] elegidos), onSelect (nuevosArchivos), onRemove (posición), error (texto o null).
function ImageFilePicker({ archivos, onSelect, onRemove, error }) {
  return (
    <fieldset>
      <legend className="label">Imágenes desde tu equipo (opcional)</legend>
      <p className="hint">JPG, PNG o WEBP, de hasta 5 MB cada una. Se suben al guardar el plato.</p>
      {/* Un type="file" no se controla con value: lo maneja el navegador */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="field mt-3"
        aria-label="Elegir imágenes desde tu equipo"
        onChange={(event) => {
          // files es una FileList: se copia a un array ANTES de vaciar el campo, para poder elegir el mismo archivo de nuevo.
          onSelect([...event.target.files])
          event.target.value = ''
        }}
        aria-invalid={error !== null ? 'true' : 'false'}
      />
      <ul className="mt-3 space-y-2">
        {archivos.map((archivo, index) => (
          <li key={`${archivo.name}-${index}`} className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined flex-none" aria-hidden="true">image</span>
            <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
            <span className="flex-none">{(archivo.size / 1024).toFixed(1)} KB</span>
            <button type="button" className="btn btn-quiet btn-sm !text-error" onClick={() => onRemove(index)}>
              <span className="material-symbols-outlined">delete</span>
              <span className="sr-only">Quitar {archivo.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {error !== null && (
        <p className="hint hint--error" role="alert">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}

export default ImageFilePicker

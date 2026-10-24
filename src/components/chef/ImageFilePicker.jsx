// Selector de imágenes desde el equipo del chef: un campo de archivos y la lista de los elegidos, con un
// botón para quitar cada uno. Se usa en views/PublicarPlato, junto a ImageUrlList (las dos formas conviven).
// Componente "tonto": no sube nada ni valida los archivos; el padre guarda la lista y los sube al guardar.

// Props:
//  - archivos: array de File, los archivos elegidos (lo guarda el padre con useState)
//  - onSelect: función del padre (nuevosArchivos); se llama al elegir archivos en el campo
//  - onRemove: función del padre (posición); quita ese archivo de la lista
//  - error: texto del error de los archivos, o null si no hay
function ImageFilePicker({ archivos, onSelect, onRemove, error }) {
  return (
    <fieldset>
      <legend className="label">Imágenes desde tu equipo (opcional)</legend>
      <p className="hint">JPG, PNG o WEBP, de hasta 5 MB cada una. Se suben al guardar el plato.</p>
      {/* Un campo type="file" no se puede "controlar" con value: su valor lo maneja el navegador.
          multiple permite elegir varios archivos a la vez. */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="field mt-3"
        aria-label="Elegir imágenes desde tu equipo"
        onChange={(event) => {
          // event.target.files es una FileList (no un array). Con [...] la pasamos a un array ANTES de
          // vaciar el campo: así se puede volver a elegir el mismo archivo y la lista no se pierde.
          onSelect([...event.target.files])
          event.target.value = ''
        }}
        aria-invalid={error !== null ? 'true' : 'false'}
      />
      <ul className="mt-3 space-y-2">
        {/* map: un renglón por archivo elegido. No tienen id propio: usamos nombre + posición como key. */}
        {archivos.map((archivo, index) => (
          <li key={`${archivo.name}-${index}`} className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined flex-none" aria-hidden="true">image</span>
            <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
            {/* size viene en bytes: lo pasamos a KB, con una cifra decimal */}
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

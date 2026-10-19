// Selección múltiple de categorías (casillas). Se usa en views/PublicarPlato.
// Componente "tonto": no guarda cuáles están elegidas, el padre manda los ids y recibe los cambios.

// Props:
//  - categories: array de categorías con la forma de la API: { id, description }
//  - selectedIds: array con los ids elegidos (lo guarda el padre con useState)
//  - onToggle: función del padre (id); se llama al tocar una categoría. El padre la agrega si no
//    estaba y la quita si estaba.
function CategoryPicker({ categories, selectedIds, onToggle }) {
  return (
    <fieldset>
      <legend className="label">Categorías</legend>
      <div className="flex flex-wrap gap-2">
        {/* map: una casilla por categoría. key = id, único y estable */}
        {categories.map((categoria) => (
          <label key={categoria.id} className="chip">
            {/* Checkbox "controlado": React decide si está marcado y al tocarlo avisa al padre.
                includes devuelve true si el array contiene ese id. */}
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedIds.includes(categoria.id)}
              onChange={() => onToggle(categoria.id)}
            />
            {categoria.description}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default CategoryPicker

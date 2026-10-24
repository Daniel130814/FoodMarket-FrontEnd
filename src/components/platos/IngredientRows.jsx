// Filas de ingredientes de un plato: ingrediente del catálogo, cantidad y unidad. Se usa en views/PublicarPlato.
// Componente "tonto": las filas y las funciones vienen del padre.

// Las unidades de medida que acepta la API (ENDPOINTS.md, sección 4) y cómo se muestran.
const UNIDADES = [
  { valor: 'GRAMOS', etiqueta: 'Gramos (g)' },
  { valor: 'KILOGRAMOS', etiqueta: 'Kilogramos (kg)' },
  { valor: 'MILILITROS', etiqueta: 'Mililitros (ml)' },
  { valor: 'LITROS', etiqueta: 'Litros (l)' },
  { valor: 'UNIDAD', etiqueta: 'Unidades (u)' },
]

// Props:
//  - rows: array de filas { ingredienteId, cantidad, unidadMedida } (lo guarda el padre)
//  - catalog: ingredientes disponibles { id, nombre, descripcion }
//  - onChange: función del padre (posición, campo, valor); se llama al cambiar un campo de una fila
//  - onAdd: función del padre sin argumentos; agrega una fila vacía
//  - onRemove: función del padre (posición); quita esa fila
//  - error: texto del error de los ingredientes, o null si no hay
function IngredientRows({ rows, catalog, onChange, onAdd, onRemove, error }) {
  return (
    <fieldset>
      <legend className="label">Ingredientes</legend>
      <ul className="space-y-3">
        {/* map: una fila por ingrediente. Las filas no tienen un id propio, así que usamos la
            posición (index) como key; los valores los controla el padre. */}
        {rows.map((fila, index) => (
          <li key={index} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_160px_auto] sm:items-center">
            <select
              className="field"
              aria-label={`Ingrediente ${index + 1}`}
              value={fila.ingredienteId}
              onChange={(event) => onChange(index, 'ingredienteId', event.target.value)}
            >
              <option value="">Elegí un ingrediente</option>
              {catalog.map((ingrediente) => (
                <option key={ingrediente.id} value={ingrediente.id}>{ingrediente.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="any"
              className="field"
              placeholder="Cantidad"
              aria-label={`Cantidad del ingrediente ${index + 1}`}
              value={fila.cantidad}
              onChange={(event) => onChange(index, 'cantidad', event.target.value)}
            />
            <select
              className="field"
              aria-label={`Unidad del ingrediente ${index + 1}`}
              value={fila.unidadMedida}
              onChange={(event) => onChange(index, 'unidadMedida', event.target.value)}
            >
              {UNIDADES.map((unidad) => (
                <option key={unidad.valor} value={unidad.valor}>{unidad.etiqueta}</option>
              ))}
            </select>
            <button type="button" className="btn btn-quiet btn-sm !text-error" onClick={() => onRemove(index)}>
              <span className="material-symbols-outlined">delete</span>
              <span className="sr-only">Quitar ingrediente {index + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
          <span className="material-symbols-outlined">add</span>Agregar ingrediente
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

export default IngredientRows

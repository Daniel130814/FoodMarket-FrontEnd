// Fila de chips para filtrar una lista (con un contador en cada uno). Se usa en views/MisPublicaciones.
// Componente "tonto": no guarda cuál filtro está activo, el padre manda el id y recibe los cambios.

// Props:
//  - options: array de filtros { id, label, count }. count es la cantidad que se muestra al lado.
//  - activeId: id del filtro activo (lo guarda el padre con useState)
//  - onChange: función del padre (id); se llama al tocar un chip
//  - label: nombre accesible del grupo de filtros (lo lee el lector de pantalla)
function FilterChips({ options, activeId, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {/* map: un chip por filtro. key = id, único y estable. aria-pressed marca el activo. */}
      {options.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className="chip"
          aria-pressed={opcion.id === activeId}
          onClick={() => onChange(opcion.id)}
        >
          {opcion.label} <span className="tabular opacity-80">{opcion.count}</span>
        </button>
      ))}
    </div>
  )
}

export default FilterChips

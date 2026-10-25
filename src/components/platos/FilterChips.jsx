// Fila de chips para filtrar una lista, con un contador en cada uno. No guarda el filtro activo: lo manda el padre.

// Props: options ({ id, label, count }), activeId, onChange (id), label (nombre accesible del grupo).
function FilterChips({ options, activeId, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
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

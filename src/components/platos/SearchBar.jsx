// Barra de búsqueda por nombre de plato. No guarda el texto: lo manda el padre.

// Props: value, onChange (recibe el evento), name (para que un solo handler sirva a varios inputs), placeholder.
function SearchBar({ value, onChange, name = 'nombre', placeholder = 'Buscar plato' }) {
  return (
    <div role="search" className="relative block">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          aria-hidden="true"
        >
          search
        </span>
        <input
          type="search"
          name={name}
          className="field !pl-11"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </label>
    </div>
  )
}

export default SearchBar

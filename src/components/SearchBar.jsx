function SearchBar({ placeholder = 'Buscar plato o chef' }) {
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
        <input type="search" className="field !pl-11" placeholder={placeholder} />
      </label>
    </div>
  )
}

export default SearchBar

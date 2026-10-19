// Barra de búsqueda por nombre de plato. Se usa en views/Catalogo.
// Componente "tonto": no guarda el texto, el padre manda el valor y recibe los cambios.

// Props:
//  - value: texto que muestra el campo (lo guarda el padre con useState)
//  - onChange: función del padre; recibe el evento del input (el padre lee event.target)
//  - name: nombre del campo en el estado del padre (así un solo handler sirve para varios inputs)
//  - placeholder: texto de ayuda cuando el campo está vacío
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
        {/* Input "controlado": React decide qué texto muestra (value) y avisa cada cambio (onChange) */}
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

// Formulario para cargar un domicilio nuevo. Se usa en views/Checkout.
// Componente "tonto": los datos, los errores y las funciones vienen del padre (Checkout).

// Los campos del formulario, en el orden en que se dibujan. Con un array y map evitamos repetir
// el mismo bloque de label + input diez veces. required marca los obligatorios (los que la API
// valida con @NotBlank); el resto son opcionales.
const CAMPOS = [
  { name: 'calle', label: 'Calle', required: true, autoComplete: 'address-line1' },
  { name: 'numero', label: 'Número', required: true, autoComplete: 'off' },
  { name: 'piso', label: 'Piso (opcional)', required: false, autoComplete: 'off' },
  { name: 'departamento', label: 'Departamento (opcional)', required: false, autoComplete: 'off' },
  { name: 'ciudad', label: 'Ciudad', required: true, autoComplete: 'address-level2' },
  { name: 'provincia', label: 'Provincia', required: true, autoComplete: 'address-level1' },
  { name: 'codigoPostal', label: 'Código postal', required: true, autoComplete: 'postal-code' },
  { name: 'indicacionesEntrega', label: 'Indicaciones de entrega (opcional)', required: false, autoComplete: 'off' },
]

// Props:
//  - datos: objeto con el valor de cada campo { calle, numero, piso, ... } (lo guarda el padre)
//  - errores: objeto con el mensaje de error de cada campo, o vacío si no hay
//  - onChange: función del padre; recibe el evento del input (el padre lee event.target)
//  - onSubmit: función del padre; recibe el evento del formulario
//  - onCancel: función del padre; se llama al tocar "Cancelar"
function DomicilioForm({ datos, errores, onChange, onSubmit, onCancel }) {
  return (
    <form className="mt-5 rounded-lg border border-hairline bg-surface-container-lowest p-5" onSubmit={onSubmit} noValidate>
      <h3 className="font-display text-title-md text-primary">Nuevo domicilio</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* map: un campo por cada elemento de CAMPOS. key = name, único */}
        {CAMPOS.map((campo) => (
          <div key={campo.name} className={campo.name === 'indicacionesEntrega' ? 'sm:col-span-2' : ''}>
            <label className="label" htmlFor={`dom-${campo.name}`}>{campo.label}</label>
            <input
              id={`dom-${campo.name}`}
              name={campo.name}
              type="text"
              className="field"
              autoComplete={campo.autoComplete}
              value={datos[campo.name]}
              onChange={onChange}
              aria-invalid={errores[campo.name] ? 'true' : 'false'}
            />
            {/* Renderizado condicional: el error solo aparece si ese campo tiene uno */}
            {errores[campo.name] && (
              <p className="hint hint--error">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                <span>{errores[campo.name]}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary">Guardar domicilio</button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

export default DomicilioForm

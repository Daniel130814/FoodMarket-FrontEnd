// Formulario para cargar un domicilio nuevo; los datos, errores y funciones vienen de Checkout.

// Campos del formulario, en orden. required marca los que la API exige (@NotBlank).
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

// Props: datos (valor de cada campo), errores (mensaje por campo), onChange (evento del input), onSubmit (evento del formulario), onCancel.
function DomicilioForm({ datos, errores, onChange, onSubmit, onCancel }) {
  return (
    <form className="mt-5 rounded-lg border border-hairline bg-surface-container-lowest p-5" onSubmit={onSubmit} noValidate>
      <h3 className="font-display text-title-md text-primary">Nuevo domicilio</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

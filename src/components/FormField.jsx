// Campo de formulario: etiqueta, input y mensaje de error juntos. Se usa en views/Admin (crear usuario).
// Componente "tonto": no guarda el valor, el padre manda cuánto vale y recibe cada cambio.

// Props:
//  - label: texto de la etiqueta (el <label> se une al input con htmlFor/id, así leer la etiqueta enfoca el campo)
//  - name: nombre del campo en el estado del padre; el mismo handler lo lee con event.target.name
//  - type: tipo de input ('text', 'email', 'password'...). Por defecto 'text'
//  - value: valor actual (lo guarda el padre con useState)
//  - onChange: función del padre; se llama en cada tecla (el padre lee event.target.value)
//  - error: mensaje de error del campo, o null/undefined si está bien
//  - autoComplete: pista para el navegador (por ejemplo 'off' o 'new-password')
function FormField({ label, name, type = 'text', value, onChange, error, autoComplete }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className="field"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
      />
      {/* Renderizado condicional: el error solo aparece si hay uno */}
      {error && (
        <p className="hint hint--error">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export default FormField

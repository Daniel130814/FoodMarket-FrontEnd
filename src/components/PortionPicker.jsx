// Selector de porción (Individual / Para compartir). Se usa en views/DetallePlato.
// Igual que QuantityStepper: no guarda nada, el padre manda lo elegido y recibe los cambios.

// Props:
//  - options: array de porciones { id, name, description, price }
//  - value: id de la porción elegida (lo guarda el padre con useState)
//  - onChange: función del padre; la llamamos con el id de la porción tocada
function PortionPicker({ options, value, onChange }) {
  // Misma función de formato que en PlatoCard: 18400 -> $18.400
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <fieldset>
      <legend className="mb-3 p-0 font-display text-headline-sm text-primary">Porción</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opcion) => (
          <label key={opcion.id} className="option !py-3">
            {/* Radio "controlado": React decide cuál está marcado (checked) según value,
                y al tocarlo avisamos al padre con onChange */}
            <input
              type="radio"
              name="porcion"
              className="radio mt-0.5"
              checked={opcion.id === value}
              onChange={() => onChange(opcion.id)}
            />
            <span className="flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-label-lg text-primary">{opcion.name}</span>
                <span className="tabular font-display text-[17px] text-primary">{formatear(opcion.price)}</span>
              </span>
              <span className="block text-body-sm text-on-surface-variant">{opcion.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default PortionPicker

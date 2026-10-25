// Lista de domicilios guardados para elegir uno. No guarda el elegido: lo manda el padre.

// Props: domicilios (DomicilioResponse), selectedId (o null), onSelect (id).
function DomicilioPicker({ domicilios, selectedId, onSelect }) {
  return (
    <fieldset>
      <legend className="mb-3 p-0 font-display text-headline-sm text-primary">Domicilio de entrega</legend>
      <div className="grid gap-3">
        {domicilios.map((domicilio) => (
          <label key={domicilio.id} className="option">
            <input
              type="radio"
              name="domicilio"
              className="radio mt-0.5"
              checked={domicilio.id === selectedId}
              onChange={() => onSelect(domicilio.id)}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-label-lg text-primary">
                {domicilio.calle} {domicilio.numero}
                {/* Piso y departamento son opcionales (pueden ser null) */}
                {domicilio.piso !== null && `, piso ${domicilio.piso}`}
                {domicilio.departamento !== null && ` ${domicilio.departamento}`}
              </span>
              <span className="block text-body-sm text-on-surface-variant">
                {domicilio.ciudad}, {domicilio.provincia} (CP {domicilio.codigoPostal})
              </span>
              {domicilio.indicacionesEntrega !== null && (
                <span className="block text-body-sm text-on-surface-variant">{domicilio.indicacionesEntrega}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default DomicilioPicker

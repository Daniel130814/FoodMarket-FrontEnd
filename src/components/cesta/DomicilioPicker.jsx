// Lista de domicilios guardados para elegir uno. Se usa en views/Checkout.
// Componente "tonto": no guarda cuál está elegido, el padre manda el id y recibe los cambios.

// Props:
//  - domicilios: array con la forma de DomicilioResponse de la API
//    { id, calle, numero, piso, departamento, ciudad, provincia, codigoPostal, indicacionesEntrega }
//  - selectedId: id del domicilio elegido, o null si no hay ninguno (lo guarda el padre)
//  - onSelect: función del padre (id); se llama al tocar un domicilio
function DomicilioPicker({ domicilios, selectedId, onSelect }) {
  return (
    <fieldset>
      <legend className="mb-3 p-0 font-display text-headline-sm text-primary">Domicilio de entrega</legend>
      <div className="grid gap-3">
        {/* map: una opción por domicilio. key = id, único y estable */}
        {domicilios.map((domicilio) => (
          <label key={domicilio.id} className="option">
            {/* Radio "controlado": React decide cuál está marcado y al tocarlo avisa al padre */}
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
                {/* Renderizado condicional: piso y departamento son opcionales (pueden ser null) */}
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

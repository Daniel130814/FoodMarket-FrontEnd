// Tarjeta de opción (radio) para elegir el tipo de cuenta. Se usa en views/Registro.
// Componente "tonto": no guarda lo elegido, el padre manda si está marcada y recibe el cambio.

// Props:
//  - value: valor que representa esta opción ("CLIENTE" o "CHEF", los de la API)
//  - checked: true si esta opción es la elegida (lo decide el padre con su estado)
//  - onChange: función del padre; se llama al tocar la opción (el padre lee event.target.value)
//  - icon: nombre del ícono de Material Symbols (por ejemplo "shopping_bag")
//  - title: texto principal de la opción
//  - description: texto chico que explica la opción
function RoleOption({ value, checked, onChange, icon, title, description }) {
  return (
    <label className="option">
      {/* Radio "controlado": React decide cuál está marcado (checked) y al tocarlo avisa al padre.
          name="tipoCuenta" es el nombre del campo en el estado del padre. */}
      <input
        type="radio"
        name="tipoCuenta"
        value={value}
        className="radio mt-0.5"
        checked={checked}
        onChange={onChange}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-label-lg text-primary">
          <span className="material-symbols-outlined text-[20px] text-surface-tint" aria-hidden="true">
            {icon}
          </span>
          {title}
        </span>
        <span className="mt-0.5 block text-body-sm text-on-surface-variant">{description}</span>
      </span>
    </label>
  )
}

export default RoleOption

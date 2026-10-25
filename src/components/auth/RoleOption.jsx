// Opción (radio) para elegir el tipo de cuenta en views/Registro. No guarda lo elegido: el padre decide si está marcada.

// Props: value ("CLIENTE" o "CHEF"), checked, onChange (el padre lee event.target.value), icon (Material Symbols),
// title, description.
function RoleOption({ value, checked, onChange, icon, title, description }) {
  return (
    <label className="option">
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

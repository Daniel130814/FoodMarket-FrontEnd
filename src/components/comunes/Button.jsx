// Botón reutilizable de la app.

// Props: children (el texto), variant ('primary' por defecto o 'secondary'; arma la clase btn-<variant>), onClick, disabled.
function Button({ children, variant = 'primary', onClick, disabled = false }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button

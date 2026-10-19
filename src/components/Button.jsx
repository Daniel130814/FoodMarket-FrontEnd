// Botón reutilizable de la app. Se usa en varias vistas y componentes (Catalogo, DetallePlato, PlatoCard, OrderSummary...).

// Props:
//  - children: lo que se escribe entre <Button> y </Button> (el texto del botón)
//  - variant: estilo del botón: 'primary' (por defecto) o 'secondary'. Con eso se arma la clase CSS btn-<variant>
//  - onClick: función que se ejecuta al tocar el botón (la define el padre)
//  - disabled: true para deshabilitarlo (por ejemplo, un plato agotado)
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

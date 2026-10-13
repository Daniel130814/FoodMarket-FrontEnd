// Selector de cantidad (− 1 +). Se usa en views/DetallePlato.
// No guarda la cantidad: la recibe del padre y le avisa cuando el usuario la cambia.

// Props:
//  - value: cantidad actual (la maneja el padre con useState)
//  - min / max: límites permitidos (en el detalle: 1 y el stock del plato)
//  - onChange: función del padre; la llamamos con la nueva cantidad
function QuantityStepper({ value, min = 1, max, onChange }) {
  return (
    <div className="qty qty--lg">
      {/* Se deshabilita al llegar al mínimo, así no se puede bajar de min */}
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Menos"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <output aria-live="polite">{value}</output>
      {/* Se deshabilita al llegar al máximo (el stock del plato) */}
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Más"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}

export default QuantityStepper

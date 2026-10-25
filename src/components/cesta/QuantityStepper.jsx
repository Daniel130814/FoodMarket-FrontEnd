// Selector de cantidad (− 1 +). No guarda la cantidad: la recibe del padre y le avisa cuando cambia.

// Props: value, min y max (límites; en el detalle 1 y el stock, en el stock del chef 0 y 99), onChange (nueva cantidad).
function QuantityStepper({ value, min = 1, max, onChange }) {
  return (
    <div className="qty qty--lg">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Menos"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <output aria-live="polite">{value}</output>
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

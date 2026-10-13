// Aviso flotante abajo de la pantalla. Lo dibuja CartProvider (context/CartContext).
// Solo muestra: el estado (qué mensaje y si está visible) vive en quien lo usa.

// Props:
//  - message: texto del aviso
//  - visible: true para mostrarlo, false para esconderlo
//  - onClose: función que se llama al tocar "Cerrar"
function Toast({ message, visible, onClose }) {
  return (
    // La clase is-visible (definida en index.css) hace que el aviso suba desde abajo.
    // Con template string sumamos esa clase solo cuando visible es true.
    <div className={`toast ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite">
      <span className="material-symbols-outlined fill text-[20px] text-primary-fixed-dim">check_circle</span>
      <span>{message}</span>
      <button type="button" onClick={onClose} className="font-semibold underline underline-offset-4">
        Cerrar
      </button>
    </div>
  )
}

export default Toast

// Aviso flotante abajo de la pantalla (App lo dibuja una vez). Solo muestra: el estado vive en quien lo usa.

// Props: message, visible, onClose (al tocar "Cerrar").
function Toast({ message, visible, onClose }) {
  return (
    // is-visible (en index.css) hace que el aviso suba desde abajo.
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

// Aviso flotante abajo de la pantalla (App lo dibuja una vez). Solo muestra: el estado vive en quien lo usa.

// Ícono y color según el tipo de aviso.
const ICONOS = {
  exito: { nombre: 'check_circle', color: 'text-primary-fixed-dim' },
  error: { nombre: 'error', color: 'text-error-container' },
}

// Props: message, tipo ('exito' por defecto o 'error'), visible, onClose (al tocar "Cerrar").
function Toast({ message, tipo = 'exito', visible, onClose }) {
  const icono = ICONOS[tipo]

  return (
    // is-visible (en index.css) hace que el aviso suba desde abajo.
    <div className={`toast ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite">
      <span className={`material-symbols-outlined fill text-[20px] ${icono.color}`}>{icono.nombre}</span>
      <span>{message}</span>
      <button type="button" onClick={onClose} className="font-semibold underline underline-offset-4">
        Cerrar
      </button>
    </div>
  )
}

export default Toast

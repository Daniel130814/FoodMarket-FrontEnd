// Ventana de confirmación (diálogo modal) hecha con estado. Reemplaza a confirm(), que está prohibido.
// Se usa en views/MisPedidos para confirmar la cancelación de un pedido.
// Componente "tonto": el padre decide cuándo se muestra (open) y qué pasa al confirmar o cancelar.

// Props:
//  - open: true para mostrarlo, false para esconderlo (lo guarda el padre con useState)
//  - title / message: textos del diálogo
//  - confirmLabel: texto del botón que confirma (el rojo)
//  - cancelLabel: texto del botón que cierra sin hacer nada
//  - onConfirm: función del padre; se llama al tocar el botón que confirma
//  - onCancel: función del padre; se llama al tocar el otro botón o el fondo oscuro
function Dialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  // Si no está abierto no dibujamos nada. null es "no mostrar nada" en React.
  if (!open) {
    return null
  }

  return (
    // Fondo oscuro que cubre toda la pantalla. Al tocarlo se cancela.
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(24,36,11,0.45)] p-4"
      onClick={onCancel}
    >
      {/* role="dialog" y aria-modal avisan a los lectores de pantalla que es una ventana modal.
          stopPropagation evita que un toque DENTRO del diálogo llegue al fondo y lo cierre. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-titulo"
        className="w-full max-w-[30rem] rounded-3xl bg-white p-6 shadow-lift sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-titulo" className="font-display text-headline-md text-primary">{title}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default Dialog

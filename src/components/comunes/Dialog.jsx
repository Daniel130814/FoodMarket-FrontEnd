// Diálogo modal de confirmación hecho con estado (reemplaza a confirm()). El padre decide cuándo se muestra y qué pasa al confirmar.

// Props: open, title, message, confirmLabel, confirmVariant ('danger' por defecto o 'primary'), cancelLabel,
// children (contenido extra entre el mensaje y los botones), onConfirm, onCancel (también al tocar el fondo).
function Dialog({ open, title, message, confirmLabel, confirmVariant = 'danger', cancelLabel, onConfirm, onCancel, children }) {
  // Cerrado: no dibuja nada.
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(24,36,11,0.45)] p-4"
      onClick={onCancel}
    >
      {/* stopPropagation evita que un toque dentro del diálogo llegue al fondo y lo cierre */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-titulo"
        className="w-full max-w-[30rem] rounded-3xl bg-white p-6 shadow-lift sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-titulo" className="font-display text-headline-md text-primary">{title}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
        {children}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn btn-${confirmVariant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default Dialog

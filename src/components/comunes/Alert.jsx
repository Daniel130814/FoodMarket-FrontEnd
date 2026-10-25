// Aviso de error con una lista de mensajes (por ejemplo, conflictos de stock).

// Props: title, messages (array de textos, uno por problema).
function Alert({ title, messages }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-error/30 bg-error-container p-4 text-on-error-container">
      <span className="material-symbols-outlined fill" aria-hidden="true">error</span>
      <div>
        <p className="text-label-lg">{title}</p>
        <ul className="mt-1 space-y-1 text-body-sm">
          {messages.map((mensaje) => (
            // El texto hace de key: cada mensaje menciona un plato distinto.
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Alert

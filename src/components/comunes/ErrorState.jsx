// Pantalla de "algo salió mal" para las vistas que piden datos al backend.

// Props: message (texto del error, por ejemplo el de la API).
function ErrorState({ message }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md py-16 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-error-container text-on-error-container">
        <span className="material-symbols-outlined fill text-[36px]" aria-hidden="true">error</span>
      </span>
      <h1 className="mt-6 font-display text-headline-md text-primary">No pudimos cargar la página</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
    </div>
  )
}

export default ErrorState

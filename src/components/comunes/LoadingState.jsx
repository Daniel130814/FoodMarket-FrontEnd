// Pantalla de "cargando" con un ícono girando, para las vistas que piden datos al backend.

// Props: message (texto debajo del ícono, por ejemplo "Cargando los platos...").
function LoadingState({ message }) {
  return (
    <div role="status" className="mx-auto mt-10 max-w-md py-16 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface-container-high text-primary">
        <span className="material-symbols-outlined animate-spin text-[36px]" aria-hidden="true">progress_activity</span>
      </span>
      <p className="mt-6 text-body-md text-on-surface-variant">{message}</p>
    </div>
  )
}

export default LoadingState

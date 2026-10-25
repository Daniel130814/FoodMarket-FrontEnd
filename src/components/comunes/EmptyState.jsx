// Pantalla de "no hay nada para mostrar" con un botón de salida.
import Button from './Button'

// Props: title, message, actionLabel (texto del botón), onAction.
function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="mx-auto mt-10 max-w-md py-16 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface-container-high text-primary">
        <span className="material-symbols-outlined text-[36px]" aria-hidden="true">shopping_bag</span>
      </span>
      <h1 className="mt-6 font-display text-headline-md text-primary">{title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
      <div className="mt-8">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  )
}

export default EmptyState

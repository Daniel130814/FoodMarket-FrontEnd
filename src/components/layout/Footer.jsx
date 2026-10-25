// Pie de página (todas las vistas menos Ingreso y Registro).
import Logo from './Logo'

// No recibe props: es contenido fijo.
function Footer() {
  return (
    <footer className="mt-20 border-t border-hairline bg-surface-container-low lg:mt-28">
      <div className="mx-auto max-w-shell px-5 py-14 lg:px-12 lg:py-16">
        <Logo />
        <p className="mt-3 font-display text-headline-sm italic text-secondary">
          Comida real, personas reales.
        </p>
        <p className="mt-4 max-w-sm text-body-md text-on-surface-variant">
          Conectamos hogares con talleres de cocina independientes. Cada plato tiene nombre, apellido y origen.
        </p>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-shell px-5 py-5 text-body-sm text-on-surface-variant lg:px-12">
          © 2026 Appetitos. Hecho con paciencia y fuego lento.
        </p>
      </div>
    </footer>
  )
}

export default Footer

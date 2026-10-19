// Logo de Appetitos (texto con la manzana dibujada en SVG). Se usa en Header, Footer, Ingreso y Registro.

// Props:
//  - size: tamaño del logo: 'md' (por defecto) o 'lg'
//  - onDark: true si se dibuja sobre un fondo oscuro (cambia los colores)
function Logo({ size = 'md', onDark = false }) {
  // Armamos la lista de clases CSS y la unimos con join(' '). push agrega un elemento a esta lista local.
  const clases = ['logo']
  if (size === 'lg') clases.push('logo--lg')
  if (onDark) clases.push('logo--on-dark')

  return (
    <span className={clases.join(' ')} role="img" aria-label="Appetitos">
      <span aria-hidden="true">Appetit</span>
      <svg viewBox="0 0 16 17.6" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M8 0C3.6 0 0 4 0 8.8C0 13.6 3.6 17.6 8 17.6C12.4 17.6 16 13.6 16 8.8C16 7.1 15.5 5.5 14.6 4.2C14.1 4.8 13.3 5.2 12.4 5.1C11.8 5 11.3 4.5 11 3.9C10.7 3.1 10.9 2.3 11.5 1.7C11.1 1.4 10.6 1.2 10.1 1.2C9.5 1.1 9 1.3 8.5 1.6C8.8 1 8.8 0.5 8.5 0.1C8.3 0.1 8.1 0 8 0ZM8 4.6C8.7 4.6 9.3 4.8 9.8 5.1C9.5 5.7 9.6 6.5 10.1 7C10.6 7.6 11.5 7.8 12.2 7.4C12.4 8 12.5 8.7 12.5 9.4C12.5 11.9 10.5 13.8 8 13.8C5.5 13.8 3.5 11.9 3.5 9.4C3.5 6.9 5.5 4.6 8 4.6Z"
        />
        <circle cx="15.2" cy="1.6" r=".8" fill="#c4572e" />
        <circle cx="13.8" cy="-.6" r=".5" fill="#c8b27a" />
      </svg>
      <span aria-hidden="true">s</span>
    </span>
  )
}

export default Logo

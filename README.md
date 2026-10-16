# Appetitos — Front-End

Appetitos es un e-commerce gastronómico de venta de comida, desarrollado como proyecto Full Stack para la materia **Aplicaciones Interactivas**. Su propuesta es **«De todos para todos»**.

Este repositorio corresponde al **desarrollo del Front-End de Appetitos**, construido con **React + Vite**. El objetivo es transformar los prototipos visuales generados con **Google Stitch** en una aplicación web funcional, con componentes reutilizables y preparada para conectarse al backend desarrollado en **Spring Boot**.

## Tecnologías

- **React:** construcción de la interfaz mediante componentes reutilizables.
- **Vite:** entorno de desarrollo y generación de la aplicación para producción.
- **React Router:** navegación entre vistas.
- **Tailwind CSS 3:** única librería de estilos, con los tokens de diseño de Appetitos.
- **ESLint:** revisión estática del código.

Solo se usa JavaScript (archivos `.jsx`).

## Rutas

| Ruta         | Vista              |
| ------------ | ------------------ |
| `/`          | Inicio             |
| `/catalogo`  | Catálogo de platos |
| `/plato/:id` | Detalle del plato  |
| `/carrito`   | Carrito            |
| `/pedidos`   | Pedidos            |
| `/ingreso`   | Ingreso (login)    |
| `/registro`  | Registro           |

`/ingreso` y `/registro` se muestran a pantalla completa, sin Header ni Footer.

## Estructura de `src/`

- `views/`: una vista por pantalla.
- `components/`: componentes reutilizables (Header, Footer, PlatoCard, etc.).
- `context/`: estado compartido del carrito (`CartContext`).
- `data/`: datos de ejemplo hasta conectar el backend.
- `App.jsx` y `main.jsx`: punto de entrada; el router vive en `App.jsx`.

## Ejecución local

Con Node.js y npm instalados, ejecutar desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abrir en el navegador la dirección indicada por Vite en la terminal.

### Otros comandos

```bash
npm run build    # Genera la versión de producción
npm run preview  # Permite previsualizar la versión generada
npm run lint     # Revisa el código con ESLint
```

## Integrantes del grupo

- Daniel Vidal.
- Martin Garcia Kurilkowich.
- Nehuen Zaloaga.

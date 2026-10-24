# Appetitos — Front-End

Appetitos es un e-commerce gastronómico de venta de comida, desarrollado como proyecto Full Stack para la materia **Aplicaciones Interactivas**. Su propuesta es **«De todos para todos»**.

Este repositorio corresponde al **Front-End de Appetitos**, construido con **React + Vite**. Transforma los prototipos visuales generados con **Google Stitch** en una aplicación web funcional, con componentes reutilizables, conectada al backend desarrollado en **Spring Boot** (otro repositorio).

## Tecnologías

- **React:** construcción de la interfaz mediante componentes reutilizables.
- **Vite:** entorno de desarrollo y generación de la aplicación para producción.
- **React Router:** navegación entre vistas y rutas protegidas por rol.
- **Tailwind CSS 3:** única librería de estilos, con los tokens de diseño de Appetitos.
- **fetch nativo:** conexión con la API (sin Axios ni otras librerías).
- **ESLint:** revisión estática del código.

Solo se usa JavaScript (archivos `.jsx`).

## Qué se puede hacer

La app tiene tres tipos de cuenta, cada uno con su propio recorrido:

- **Cliente:** explora el catálogo (con filtros), mira el detalle de un plato, arma su cesta, elige un domicilio y confirma el pedido, lo paga, sigue su estado y deja una reseña cuando se lo entregan.
- **Chef:** publica, edita, pausa y elimina sus platos, maneja su stock y sus descuentos, y avanza los pedidos que le tocan (Recibido, Cocinando, En camino, Entregado).
- **Administrador:** aprueba o rechaza los pagos de los clientes, crea cuentas con el rol que quiera y edita el nombre, el apellido y el correo de cualquier usuario.

Las tres cuentas pueden ver y editar sus propios datos en **Mi perfil** (haciendo clic en su nombre del Header).

Un pedido no sale de «Pendiente de confirmación» hasta que el cliente lo paga y un administrador aprueba ese pago; recién entonces el chef puede empezar a prepararlo.

## Rutas

| Ruta                 | Vista                                        | Acceso  |
| -------------------- | -------------------------------------------- | ------- |
| `/`                  | Inicio                                       | Público |
| `/catalogo`          | Catálogo de platos                           | Público |
| `/plato/:id`         | Detalle del plato y sus reseñas              | Público |
| `/ingreso`           | Ingreso (login)                              | Público |
| `/registro`          | Registro (cliente o chef)                    | Público |
| `/cesta`             | Cesta                                        | Cliente |
| `/checkout`          | Elegir domicilio y confirmar el pedido       | Cliente |
| `/pedidos`           | Mis pedidos: seguimiento, pago y reseñas     | Cliente |
| `/mis-publicaciones` | Platos del chef: stock, descuento, eliminar  | Chef    |
| `/publicar`          | Publicar un plato nuevo                      | Chef    |
| `/publicar/:id`      | Editar un plato                              | Chef    |
| `/pedidos-recibidos` | Pedidos que le tocan al chef                 | Chef    |
| `/admin`             | Administración de pagos y usuarios           | Admin   |
| `/perfil`            | Mi perfil: ver y editar nombre, apellido y correo | Cliente, Chef, Admin |
| cualquier otra       | Página no encontrada (404)                   | Público |

`/ingreso` y `/registro` se muestran a pantalla completa, sin Header ni Footer. Las rutas privadas redirigen a `/ingreso` si no hay sesión, y al inicio si el rol no corresponde.

## Estructura de `src/`

- `views/`: una vista por pantalla; tiene el estado y las llamadas a la API.
- `components/`: piezas de interfaz reutilizables (Header, PlatoCard, Dialog, etc.), ordenadas en subcarpetas por dominio: `comunes/`, `layout/`, `platos/`, `cesta/`, `pedidos/`, `chef/` y `auth/`. Solo reciben props y avisan hacia arriba: no hacen llamadas a la API.
- `App.jsx` y `main.jsx`: punto de entrada. `main.jsx` envuelve la app con `BrowserRouter`; `App.jsx` define las rutas y guarda el estado compartido (sesión, cesta y avisos).

## Ejecución local

Este repositorio es solo el Front-End: **necesita el backend corriendo** para funcionar.

1. **Backend:** levantar el proyecto Spring Boot (con su base de datos MySQL) en `http://localhost:4002`. Su contrato está en [ENDPOINTS.md](ENDPOINTS.md).
2. **Variables de entorno:** copiar `.env.example` como `.env` (no se sube al repositorio). Por defecto apunta a `http://localhost:4002`:

   ```bash
   cp .env.example .env        # en Windows (cmd): copy .env.example .env
   ```

3. **Instalar y ejecutar**, con Node.js y npm instalados, desde la raíz del proyecto:

   ```bash
   npm install
   npm run dev
   ```

4. Abrir **`http://localhost:5173`**. El backend solo permite pedidos desde ese origen (CORS): si Vite usa otro puerto porque el 5173 está ocupado, la app no va a poder conectarse. En ese caso hay que cerrar el otro servidor.

Si cambiás el `.env`, reiniciá `npm run dev`.

### Otros comandos

```bash
npm run build    # Genera la versión de producción
npm run preview  # Permite previsualizar la versión generada
npm run lint     # Revisa el código con ESLint
```

## Sesión

El login guarda el token JWT en el estado de `App.jsx` y en `localStorage` (clave `jwtToken`), para no perder la sesión al recargar la página. Al abrir la app se restaura con `GET /users/me`. Si el backend responde 401, la sesión se cierra y se pide ingresar de nuevo. Para la 3.ª entrega, este manejo se migra a Redux.

## Limitaciones conocidas del backend

Cosas que el front resuelve como puede mientras el backend no las ofrezca (están marcadas como `TODO(backend)` en el código):

- No existe «mis platos» del chef: la lista sale de `GET /platos` filtrada por chef, así que los platos en **borrador** o **pausados** desaparecen al recargar la página.
- Los platos, los perfiles de chef y los ítems de la cesta no traen el nombre del chef; las reseñas no traen el nombre del autor.
- Un administrador puede crear usuarios con cualquier rol, pero no cambiar el rol de uno existente.
- No hay un administrador inicial: hay que cargarlo a mano en la base de datos.
- No hay cambio de contraseña (la vista Mi perfil edita nombre, apellido y correo) ni subida de imágenes por archivo: las fotos de los platos se cargan por URL.

## Integrantes del grupo

- Daniel Vidal.
- Martin Garcia Kurilkowich.
- Nehuen Zaloaga.

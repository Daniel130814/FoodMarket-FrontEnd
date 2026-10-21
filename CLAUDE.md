# Appetitos — Front-End (TPO Aplicaciones Interactivas, 2.º cuatrimestre 2026)

> Este archivo lo lee cualquier agente que trabaje en este repo (Claude Code, Antigravity u otro). Es la fuente de verdad de las reglas del proyecto. Si un prompt contradice algo de acá, **avisá antes de hacerlo**.

## 1. Contexto

- **Appetitos** es un e-commerce gastronómico. Este repo es solo el **front-end**: React + Vite, JavaScript (`.jsx`), Tailwind **v3**.
- El backend (Spring Boot + MySQL) está en **otro repo** y corre en `http://localhost:4002`. Su contrato está en `ENDPOINTS.md` (copia en la raíz de este repo). **Leelo antes de tocar cualquier cosa que llame a la API.**
- **2.ª entrega: 26/10/2026** (conexión front-back). La 3.ª entrega incorpora Redux (clases del 2/11 y 9/11), así que el manejo de sesión actual es transitorio.
- Quien programa es estudiante y aprende haciendo: aplicá la sección 2.

## 2. Cómo trabajar conmigo (modo mentor)

- Un paso chico por vez. Al terminar cada sub-paso: **frená**, explicame qué cambiaste y por qué, y esperá mi "seguí".
- Antes de escribir código con un concepto nuevo, explicalo en pocas líneas (qué es, para qué sirve, cómo se usa acá). Después del código, explicá línea por línea lo que sea nuevo.
- Español rioplatense (voseo), tono de mentor, sin vueltas.
- **Comentarios en español dentro del código**: encabezado de cada archivo (qué es y de qué vista/componente depende), qué hace cada función, qué recibe cada prop, y cada concepto nuevo la primera vez que aparece. En JSX: `{/* ... */}`.
- Si falta información (un endpoint, un campo, una decisión de la sección 4), **no inventes**: frená y preguntame.
- Un commit por sub-paso, con mensaje claro. Corré `npm run lint` y `npm run build` antes de commitear.
- No toques archivos fuera del paso pedido. No instales dependencias ni crees carpetas sin avisar y explicar para qué.

## 3. Reglas de la profesora (obligatorias)

### 3.1 Estructura

- Solo JavaScript (`.jsx`). Nada de TypeScript.
- `src/` contiene **solo** `views/` y `components/`; `App.jsx` y `main.jsx` quedan afuera (más los `index.css`, `App.css` y `assets/` que ya existen). **Sin otras carpetas**: nada de `services/`, `hooks/`, `utils/`, `context/`.
- No tocar `index.html` ni `main.jsx`. El router va dentro de `App.jsx`. Las fuentes se importan en `index.css`.
- Front y back son dos repos. Nunca subir `node_modules` ni `.env`.
- Una sola librería de estilos: **Tailwind v3**. No agregar otra.

### 3.2 Prohibido

- `document.*` (manipulación del DOM), cualquier `window.*`, `alert()`, `confirm()`, `prompt()`. Modales, confirmaciones, toasts y mensajes se hacen **con estado de React**.
- Única excepción: `localStorage` para el JWT (ver 3.9 y sección 4).
- `forEach`, `for` y `while` para renderizar; `==`; `var` y `let` (todo `const`).

### 3.3 Estilo de código

- Siempre `const`, siempre `===`.
- Hooks permitidos: `useState`, `useEffect` y los de Router (`useNavigate`, `useLocation`, `useParams`). Nada de `useRef`, `useMemo`, `useCallback`, `useContext` ni hooks propios hasta que se vean en clase.
- Los hooks van solo en componentes funcionales, nunca dentro de condicionales ni bucles.

### 3.4 Componentes y vistas

- Un componente es una función con nombre en mayúscula **igual al archivo** (`PlatoCard.jsx` → `function PlatoCard`), devuelve JSX con un único padre o fragment `<>...</>` y termina con `export default`.
- Una sola funcionalidad por componente, reutilizable.
- **Vista** (`views/`): se asocia a una ruta, tiene el estado y los handlers. **Componente** (`components/`): pieza de interfaz.

### 3.5 Listas

- Siempre `.map()` (el callback recibe valor e índice), con `key` única (el id; el índice solo si no hay id).
- `filter` y `find` poco: el backend filtra. `find` por id solo si no hay endpoint. Excepción: actualizar el estado local después de DELETE/PUT (3.9).

### 3.6 Formularios

- `input` + `label` + botón, controlados con `useState`, leyendo el valor con `event.target` (`value`, `name`). Los errores de validación van en estado y se muestran junto al campo.

### 3.7 Flujo de datos unidireccional

- El **padre** (vista o `App.jsx`) tiene el estado, los `fetch` y los handlers, y los pasa por props.
- Los **hijos** (`components/`) son "tontos": reciben props, renderizan y emiten eventos hacia arriba (`onAdd`, `onRemove`, ...). Sin datos propios y **sin `fetch`**.
- Estado local de un componente solo para UI propia (ej: si algo está abierto).
- El estado compartido (sesión, cesta, aviso, toast) vive en `App.jsx` y baja por props. **Sin Context** hasta que la profesora lo confirme.

### 3.8 Rutas (React Router)

- `Routes` y `Route` en `App.jsx`. `Link to="..."` para enlaces. `useNavigate` para navegar desde un handler (ej: después del login). `useParams` para `:id`. `useLocation` para volver a la ruta previa después del login.
- Nunca `window.location`.

### 3.9 Conexión con el backend (clase del 5/10)

- `fetch` nativo con promesas `.then()` / `.catch()`. Sin Axios ni otras librerías.
- **GET**: dentro de `useEffect` con array de dependencias (`[]`, o `[id]` / los filtros si cambian). El resultado se guarda con `useState`.
- **POST, PUT, PATCH y DELETE**: dentro del **handler del evento** (submit, click). **Nunca en `useEffect`.**
- Nunca poner en las dependencias de un efecto el mismo estado que ese efecto modifica (se crea un bucle).
- `fetch` **no** manda los errores HTTP (400, 401, 403, 404, 500) al `.catch()`: hay que comprobar `response.ok` y lanzar un error con el `message` del backend.
- URLs completas con protocolo: `const API_URL = import.meta.env.VITE_API_URL` y `${API_URL}/platos`. Las cabeceras van en `headers` (plural).
- Después de crear, editar o borrar, **actualizar el estado local con lo que devuelve el backend**. **Prohibido volver a pedir toda la colección con otro GET** (la profesora lo evalúa negativamente).

  | Operación   | Actualización del estado (después de confirmar el éxito)                     |
  | ----------- | ---------------------------------------------------------------------------- |
  | POST        | `setX((actuales) => [...actuales, creado])`                                  |
  | PUT / PATCH | `setX((actuales) => actuales.map((x) => x.id === editado.id ? editado : x))` |
  | DELETE      | `setX((actuales) => actuales.filter((x) => x.id !== idBorrado))`             |

- **Sesión (JWT)**
  - Login: guardar `data.access_token` (**no** `data.token`) en `localStorage` con la clave `jwtToken` y en el estado de `App.jsx`.
  - Rutas privadas: header `Authorization: Bearer ${token}`. Rutas públicas (catálogo, detalle, categorías, reseñas): **no mandar el token**, porque uno vencido da 401 incluso en rutas públicas.
  - El rol **no** viene dentro del JWT. Se guarda el `role` y el `userId` de la respuesta de login, y al iniciar la app, si hay `jwtToken`, se restaura la sesión con `GET /users/me`.
  - 401 en ruta privada → cerrar sesión y llevar a `/ingreso`. 403 → mensaje de falta de permisos.
  - Logout: `localStorage.removeItem('jwtToken')` y limpiar el estado de sesión y de cesta. **Nunca** `localStorage.clear()`. **Nunca** borrar el token al desmontar una vista (desmontar no es cerrar sesión).
  - React Strict Mode ejecuta los efectos dos veces en desarrollo: es inofensivo para los GET y es la razón por la que los POST nunca van en efectos.

### 3.10 Qué evalúa la profesora

- Estructura y modularización: vistas con su función de vista, componentes con una responsabilidad, uso correcto de hooks y estado local actualizado **sin GET repetidos**.

## 4. Decisiones pendientes de confirmar con la profesora

Mientras no responda, se usa el comportamiento por defecto. Cada decisión tiene que quedar aislada para cambiarla fácil.

| #   | Duda                                                                                                                        | Por defecto                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `localStorage` para el JWT (en clase lo mostró para esta entrega, con una advertencia ambigua; en la 3.ª quedará prohibido) | Usarlo **solo** para la clave `jwtToken`, en `App.jsx`, en tres puntos: guardar al login, leer al iniciar, borrar al logout. Si lo desaprueba, el token queda solo en el estado (se pierde al recargar). |
| 2   | `BrowserRouter` en `main.jsx` (clase del 5/10) o en `App.jsx` (notas anteriores)                                            | Dejar como está hoy y no tocar `main.jsx`.                                                                                                                                                               |
| 3   | ¿Un archivo compartido para las llamadas a la API?                                                                          | No: `fetch` directo en cada vista o handler, con la plantilla de la sección 6.                                                                                                                           |
| 4   | Context API                                                                                                                 | No usar.                                                                                                                                                                                                 |
| 5   | Paginación y orden (la API no los tiene)                                                                                    | `slice` y `sort` en la vista.                                                                                                                                                                            |
| 6   | `PortionPicker` (no existe en el backend)                                                                                   | Sacarlo de `DetallePlato`, sin borrar el archivo.                                                                                                                                                        |

## 5. Contrato con el backend (resumen; manda `ENDPOINTS.md`)

- URL base `http://localhost:4002`. Sin prefijo global; solo auth usa `/api/v1/auth/...`.
- Toda respuesta (éxito y error) llega como `{ success, message, data }`. Se lee `cuerpo.data`; en error se muestra `cuerpo.message`.
- Las listas vacías llegan con `data: null` → tratar como `data ?? []`.
- Roles: `CLIENTE`, `CHEF`, `ADMIN`. El registro público solo permite `CLIENTE` o `CHEF` (`tipoCuenta`).
- Login por **username** (no email). Contraseña de al menos 8 caracteres; username de 3 a 50.
- Usuario duplicado = HTTP 400 (no 409). Reseña duplicada, estados inválidos y stock en conflicto = 409.
- Las fechas son ISO sin zona (`2026-10-19T14:30:00`); los importes son números.
- No hay paginación ni orden. Filtros de `GET /platos`: `nombre`, `categoriaId`, `precioMin`, `precioMax`.
- Las imágenes son **solo URLs** (`imagenesUrls: string[]`); no hay subida de archivos.
- Estados de pedido y subpedido: `PENDIENTE`, `CONFIRMADO`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `CANCELADO`. Mapeo del seguimiento: `PENDIENTE` = "Pendiente de confirmación", `CONFIRMADO` = Recibido, `EN_PREPARACION` = Cocinando, `ENVIADO` = En camino, `ENTREGADO` = Entregado. "Cancelar" solo si el estado es `PENDIENTE`.
- Estados de plato: `BORRADOR`, `PUBLICADO`, `AGOTADO`, `PAUSADO` (`AGOTADO` lo calcula el backend). `DELETE /platos/{id}` borra o **pausa** si tiene historial.
- Unidades de medida: `GRAMOS` = g, `KILOGRAMOS` = kg, `MILILITROS` = ml, `LITROS` = l, `UNIDAD` = u.
- Cesta en el servidor, solo `CLIENTE`. El checkout necesita un `domicilioEntregaId` y descuenta el stock al crear el pedido. El pago (`/pagos`) es opcional y lo aprueba un ADMIN.

| Vista                        | Endpoints                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home / Catálogo              | `GET /platos` (con filtros), `GET /categories`                                                                                                           |
| Detalle                      | `GET /platos/{id}`, `GET /resenas/plato/{id}`                                                                                                            |
| Ingreso / Registro / sesión  | `POST /api/v1/auth/authenticate`, `POST /api/v1/auth/register`, `GET /users/me`                                                                          |
| Cesta                        | `GET /carrito`, `POST /carrito/items`, `PUT` y `DELETE /carrito/items/{itemId}`, `DELETE /carrito`                                                       |
| Checkout                     | `GET /domicilios`, `POST /domicilios/createDomicilio`, `POST /carrito/checkout`                                                                          |
| Mis pedidos                  | `GET /orders`, `PATCH /orders/{id}/cancelar`, `POST /resenas/createResena`                                                                               |
| Publicar / Mis publicaciones | `POST /platos/createPlato`, `PUT /platos/{id}`, `DELETE /platos/{id}`, `PATCH` y `DELETE /platos/{id}/descuento`, `GET /categories`, `GET /ingredientes` |

**Dependencias del backend (en arreglo por el equipo).** Si `ENDPOINTS.md` ya las trae, usalas. Si no, dejá un placeholder con un comentario `TODO(backend)` y listalo al terminar el paso:

- CORS para `http://localhost:5173` (sin eso el navegador bloquea todo).
- Datos semilla de categorías e ingredientes; un ADMIN inicial.
- Listar "mis platos" del chef en todos los estados, `GET /platos/{id}` visible para el dueño aunque esté en borrador o pausado, y `PATCH` de stock y de estado.
- `chefNombre` en los platos y en el perfil del chef; `imagenUrl`, `stockDisponible` y `chefNombre` en los ítems del carrito; `clienteNombre` en las reseñas.
- Que `DELETE /platos/{id}` informe si el plato quedó borrado o pausado.

## 6. Plantillas de código aprobadas

**GET al montar la vista**

```jsx
const API_URL = import.meta.env.VITE_API_URL;

const [platos, setPlatos] = useState([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch(`${API_URL}/platos`)
    .then((response) =>
      // Leemos el cuerpo y recién ahí decidimos si fue éxito o error,
      // porque fetch NO manda los errores HTTP al .catch()
      response.json().then((cuerpo) => {
        if (!response.ok) {
          const fallo = new Error(cuerpo.message);
          fallo.status = response.status;
          throw fallo;
        }
        return cuerpo.data;
      }),
    )
    .then((data) => setPlatos(data ?? [])) // lista vacía llega como null
    .catch((fallo) => setError(fallo.message))
    .finally(() => setCargando(false));
}, []);
```

**Escritura dentro de un handler (nunca en un efecto)**

```jsx
const crearDomicilio = (datos) => {
  fetch(`${API_URL}/domicilios/createDomicilio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ruta privada
    },
    body: JSON.stringify(datos),
  })
    .then((response) =>
      response.json().then((cuerpo) => {
        if (!response.ok) {
          const fallo = new Error(cuerpo.message);
          fallo.status = response.status;
          throw fallo;
        }
        return cuerpo.data;
      }),
    )
    // Sumamos el recurso creado al estado: SIN volver a pedir la lista
    .then((creado) => setDomicilios((actuales) => [...actuales, creado]))
    .catch((fallo) => setError(fallo.message));
};
```

**Restaurar la sesión al iniciar (en `App.jsx`)**

```jsx
useEffect(() => {
  const token = localStorage.getItem("jwtToken");
  if (token === null) {
    setCargandoSesion(false);
    return;
  }
  fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) =>
      response.json().then((cuerpo) => {
        if (!response.ok) throw new Error(cuerpo.message);
        return cuerpo.data;
      }),
    )
    .then((usuario) =>
      setSesion({
        token,
        userId: usuario.id,
        role: usuario.role,
        nombre: usuario.nombre,
      }),
    )
    .catch(() => localStorage.removeItem("jwtToken")) // token vencido o inválido
    .finally(() => setCargandoSesion(false));
}, []);
```

**Ruta protegida por rol (`components/RutaProtegida.jsx`)**

```jsx
function RutaProtegida({ sesion, cargandoSesion, rolesPermitidos, children }) {
  const location = useLocation();
  // Mientras se restaura la sesión no redirigimos (evita un salto a /ingreso)
  if (cargandoSesion) return <LoadingState mensaje="Verificando sesión..." />;
  // Guardamos la ruta de origen para volver después del login
  if (sesion === null)
    return (
      <Navigate to="/ingreso" replace state={{ from: location.pathname }} />
    );
  if (!rolesPermitidos.includes(sesion.role))
    return <Navigate to="/" replace />;
  return children;
}
export default RutaProtegida;
```

**Errores que NO hay que cometer (salen del ejemplo de clase)**

- Un POST dentro de `useEffect` con `[products]` como dependencia: se re-ejecuta y crea duplicados.
- Agregar `{data}` en lugar de `data` (envuelve el recurso en otro objeto) o usar `data.token` en vez de `data.access_token`.
- Escribir `header` en singular, o una URL sin `http://`.
- Asumir que `response.json()` devuelve un array, o saltear `response.ok`.
- Borrar el token al desmontar una vista o usar `localStorage.clear()`.
- Volver a pedir toda la lista después de cada escritura.

## 7. Diseño (Tailwind v3)

- Tokens y estilos base en `tailwind.config.js` e `index.css` (clases propias: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-quiet`, `.btn-sand`, `.btn-danger`, `.field`, `.chip`, `.badge-*`, `.qty`). **Los valores exactos están en esos archivos; no los inventes.**
- Paleta: verde oliva oscuro (primario), fondo crema `#fcf9f0`, acento terracota `#c46a4a`. Tipografías: Newsreader (títulos), Sora (interfaz), Fraunces (logo). Íconos Material Symbols Outlined.
- La carpeta `referencia-visual/` tiene los HTML del diseño: son **solo referencia visual y de estructura**, no son parte de la app y no se importan. Para armar una vista, leé el HTML correspondiente (ej: `detalle.html`) y convertilo a componentes JSX. Ignorá `referencia-visual/assets/app.js` (usa el DOM, está prohibido).
- Responsive: probar en ancho móvil y de escritorio.

## 8. Mapa de vistas y componentes

| Vista                               | Ruta                         | Acceso               |
| ----------------------------------- | ---------------------------- | -------------------- |
| Home                                | `/`                          | público              |
| Catalogo                            | `/catalogo`                  | público              |
| DetallePlato                        | `/plato/:id`                 | público              |
| Ingreso / Registro                  | `/ingreso`, `/registro`      | público              |
| Carrito (Cesta)                     | `/cesta`                     | CLIENTE              |
| Checkout                            | `/checkout`                  | CLIENTE              |
| MisPedidos                          | `/pedidos`                   | CLIENTE              |
| MisPublicaciones                    | `/mis-publicaciones`         | CHEF                 |
| PublicarPlato                       | `/publicar`, `/publicar/:id` | CHEF                 |
| Admin (usuarios y pagos)            | `/admin`                     | ADMIN                |
| PedidosRecibidos                    | `/pedidos-recibidos`         | CHEF                 |

Componentes compartidos: `Header`, `Footer`, `Logo`, `Button`, `PlatoCard`, `SearchBar`, `CategoryChips`, `Pagination`, `Gallery`, `QuantityStepper` (controlado: el valor viene por props), `IngredientTrace`, `ReviewList`, `CartItem`, `OrderSummary`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `Dialog`, `FormField`, `RoleOption`, `Tabs`, `OrderCard`, `SubPedidoCard`, `OrderTrack`, `Hero3D`, `DomicilioPicker`, `DomicilioForm`, `PublicationRow`, `FilterChips`, `RutaProtegida`.

## 9. Hoja de ruta

Prioridad: lo que pide el TPO (registro y login, catálogo, detalle, carrito y checkout, gestión de productos del vendedor, administración de cuentas) antes que los extras.

- [x] **1–10** Proyecto Vite, estructura, Tailwind + tokens, Logo/Button, PlatoCard, Header/Footer/rutas, Home + Catálogo, Detalle, Cesta (primero con `CartContext`, ya migrada a estado en `App.jsx` por props: si todavía existe `src/context/`, hay que borrarla), Ingreso + Registro.
- [x] **11** Mis pedidos (interfaz con datos de ejemplo): Tabs, OrderCard, OrderTrack, Dialog controlado por estado.
- [x] **11b (recortado por la fecha)** Solo esto, con datos de ejemplo: (a) Registro e Ingreso con los campos reales, (b) `RutaProtegida` por rol con `useLocation`, (c) `LoadingState` y `ErrorState` en las vistas, (d) vista `Checkout` con `DomicilioPicker` y `DomicilioForm`. Todo lo demás (forma de los datos, filtros, estados de pedido, vistas del chef) se hace directamente contra la API real.
- [x] **12 Conexión con el backend** (hecho y probado en el navegador; sin probar: 401 de token vencido en las escrituras y los 400 de stock en el checkout):
  - [x] 12.1 `.env` + CORS funcionando; login y registro reales; guardar el JWT; restaurar sesión; logout.
  - [x] 12.2 Catálogo y detalle reales (GET, filtros por query params, categorías).
  - [x] 12.3 Cesta del servidor (POST/PUT/DELETE con estado local, sin re-GET; incluye vaciar con `DELETE /carrito`).
  - [x] 12.4 Checkout con domicilio → pedido (`GET /domicilios`, `POST createDomicilio`, `POST /carrito/checkout`).
  - [x] 12.5 Mis pedidos reales + cancelar (`GET /orders`, `PATCH /orders/{id}/cancelar`).
- [x] **13** Vistas del chef conectadas: Mis publicaciones, Publicar/editar (fotos como URLs, categorías e ingredientes desde los catálogos), eliminar, stock y descuento. Hecho con las limitaciones del backend: sin "mis platos" (la lista sale de `GET /platos` filtrado por `chefId`, así que los `BORRADOR` y `PAUSADO` no se recuperan tras recargar) y sin `PATCH` de stock ni de estado (se usa `PUT` con el plato completo).
- [x] **14** Flujo completo de compra y extras (hecho). Para que un pedido salga de PENDIENTE hacen falta el pago del cliente, la aprobación de un ADMIN y que el chef avance el subpedido:
  - [x] 14a Pagos del cliente (`POST /pagos/createPago`, `GET /pagos`) en Mis pedidos.
  - [x] 14b Administración en `/admin`: pagos (aprobar, rechazar, reembolsar) y usuarios (listar y crear con rol; la API todavía no cambia roles). Incluye el componente `FormField`.
  - [x] 14c Pedidos recibidos del chef (`GET /subpedidos/chef/{userId}`, `PATCH /subpedidos/{id}/estado`).
  - [x] 14d Reseñas del cliente (`POST /resenas/createResena`) en pedidos entregados.
  - [x] 14e Perfil del chef en Inicio (`GET /chef-profiles`) y `src/data/` borrada (ya no quedan datos de ejemplo).
  - [x] 14f Hero de la home con 3D de CSS (`Hero3D`: perspectiva, capas y animación, sin librerías ni `useRef`; un render 3D real con three.js queda fuera de las reglas).

**`TODO(backend)` que quedan:** "mis platos" del chef en todos los estados; `chefNombre` en los platos y `imagenUrl` y `chefNombre` en los ítems del carrito; que `DELETE /platos/{id}` informe si borró o pausó; nombre y taller del chef en `ChefProfileResponse` (la tarjeta de Inicio muestra solo especialidad, biografía, descripción, foto y reputación); `pedidoId`, fecha y cliente en los subpedidos; `clienteNombre` en las reseñas; que un ADMIN pueda cambiar el rol de un usuario.

## 10. Antes de dar un paso por terminado

- `npm run lint` y `npm run build` sin errores.
- Buscar en `src/`: `forEach`, `==` que no sea `===`, `document.`, `window.`, `alert(`, `confirm(`, `prompt(`, `sessionStorage` y `localStorage` (este último solo puede aparecer en el manejo del JWT de `App.jsx` y del login/logout). No debe quedar ninguna otra coincidencia.
- Probar en el navegador: caso de éxito, validación, token ausente o vencido, falta de permisos, error de red, que no se dupliquen registros y que la pantalla se actualice sin F5 ni GET adicional.
- Que los componentes de `components/` no tengan `fetch` ni datos propios.
- Actualizar este checklist de la hoja de ruta y listar los `TODO(backend)` que quedaron.

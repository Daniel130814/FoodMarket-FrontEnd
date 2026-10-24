# Plan de mejoras — Front-End Appetitos (antes de la exposición)

> Surge de comparar con otros TPOs (ecommerce-frontend, FelsaniMotors) y con el material de la profesora. Todo respeta el `CLAUDE.md`: sin Context ni Redux, sin carpetas nuevas en `src/` (fuera de las subcarpetas de `components/`), `fetch` solo en vistas o `App.jsx`, y sin re-GET después de escribir.
> Se trabaja en modo mentor: un sub-paso por vez, con un commit por sub-paso y `npm run lint` + `npm run build` antes de cada commit.

## Decisiones tomadas (24/10, sin consultar a la profesora: faltan 2 días)

| # | Duda | Decisión | Por qué |
|---|---|---|---|
| 1 | ¿Dónde va `BrowserRouter`? | **En `main.jsx`**, igual que en su demo "React fetch" (`createRoot(...).render(<BrowserRouter><App /></BrowserRouter>)`) | Es lo que ella mostró en clase. Reemplaza la decisión #2 y la regla "no tocar `main.jsx`" del `CLAUDE.md` (solo para este cambio). |
| 2 | Subida de imágenes | **Se hace por archivo (multipart)**: el equipo es dueño del backend | Lo mostró en su demo de Spring. Va al final por el tiempo (Paso 8). |
| 3 | Helper compartido para `fetch` | **No se hace.** Se sigue el estilo de la profe: `fetch(...).then(...)` escrito en cada vista | Su demo `PostList` hace el `fetch` directo, sin helpers ni archivos de servicios. Ver el detalle abajo. |
| 4 | Subcarpetas en `components/` | **Sí** (Paso 6) | Ordena el proyecto, y la regla solo prohíbe carpetas nuevas en `src/`. |

**Sobre el helper (decisión 3).** La profe no usó ninguno: escribe el `fetch` completo dentro del componente que pide los datos. Los otros TPOs usan `services/api.js`, que acá está prohibido. Pasar un helper por props desde `App.jsx` no le conviene: suma más props justo cuando el objetivo es sacarlas. Además, el bloque repetido es exactamente la plantilla aprobada (sección 6 del `CLAUDE.md`), que cualquiera del equipo puede explicar línea por línea en la expo. Lo que **sí** se puede hacer sin romper nada: que cada vista tenga **un solo** bloque arriba del componente (ej. `const leerRespuesta = (response) => ...`) y lo reutilice en todos sus `fetch`, en vez de copiarlo 3 o 4 veces dentro de la misma vista. Solo si sobra tiempo.

## Orden de prioridad

| # | Mejora | Impacto en la expo | Esfuerzo |
|---|---|---|---|
| 1 | Ruta 404 | Medio | Muy bajo |
| 2 | Legibilidad del JSX (`ContenidoAsync` + funciones auxiliares) | **Alto** | Bajo |
| 3 | `BrowserRouter` a `main.jsx` + eliminar `AppContent` + bajar el estado del chef | **Alto** | Medio |
| 4 | Vista Perfil | Alto | Medio |
| 5 | Detalle de usuario en Admin | Medio | Bajo |
| 6 | Subcarpetas por dominio en `components/` | Medio | Bajo |
| 7 | Guion de demo para la exposición | Alto | Bajo |
| 8 | Subida de imágenes multipart | Medio | **Alto** (front + back) |

Si el tiempo no alcanza para el 26/10, hacer **1, 2, 3.1, 4 y 7**. El paso 8 entra solo si el backend lo tiene listo a tiempo; si no, se defiende con "hoy son URLs y la subida está en curso".

---

## Paso 1 — Ruta 404

- Nueva vista `views/NoEncontrado.jsx`: reutiliza `EmptyState` con un mensaje y un `Link to="/"` para volver al inicio.
- En `App.jsx`, como **última** ruta del layout principal: `<Route path="*" element={<NoEncontrado />} />`.
- Concepto nuevo para explicar: `path="*"` coincide con cualquier ruta que no haya coincidido antes. Por eso va al final.
- Probar con `/cualquier-cosa` y con `/plato/999999` (este último ya debería mostrar el `ErrorState` del detalle, no la 404).

## Paso 2 — Legibilidad del JSX ⭐ (lo que pidió la profe en "Renderizado condicional")

**Problema detectado.** Hay ternarios encadenados de 4 niveles dentro del JSX. Ejemplo real de `Inicio.jsx` (líneas ~139 y ~163):

```jsx
{cargando ? (
  <LoadingState ... />
) : error !== null ? (
  <ErrorState ... />
) : platosDeHoy.length === 0 ? (
  <EmptyState ... />
) : (
  <div>...lista...</div>
)}
```

El mismo patrón se repite en `Inicio` (2 veces), `Catalogo`, `PublicarPlato`, `Checkout`, `Admin` y `MisPublicaciones`. La profesora, en su PDF: *"Evitá usar condicionales demasiado anidados. Cuando haya muchos casos, usá funciones auxiliares. Mantené el JSX limpio y legible."*

### 2.a — Componente `components/ContenidoAsync.jsx`

Un componente "tonto" que resuelve los 4 estados de cualquier lista que viene del backend. Usa los `if` antes del `return`, que es la primera técnica del PDF.

```jsx
// Muestra el estado de una carga de datos: cargando, error, vacío o el contenido.
// Lo usan todas las vistas que piden una lista al backend.
// Props:
//  - cargando: boolean
//  - error: string o null
//  - vacio: boolean (true si la lista llegó sin elementos)
//  - mensajeCarga, mensajeVacio: textos para cada estado
//  - onReintentar: función opcional para el botón del ErrorState
//  - children: lo que se muestra cuando hay datos
function ContenidoAsync({ cargando, error, vacio, mensajeCarga, mensajeVacio, onReintentar, children }) {
  if (cargando) return <LoadingState mensaje={mensajeCarga} />
  if (error !== null) return <ErrorState mensaje={error} onReintentar={onReintentar} />
  if (vacio) return <EmptyState mensaje={mensajeVacio} />
  return <>{children}</>
}
export default ContenidoAsync
```

Uso en la vista:

```jsx
<ContenidoAsync
  cargando={cargando}
  error={error}
  vacio={platosDeHoy.length === 0}
  mensajeCarga="Buscando los platos de hoy..."
  mensajeVacio="Hoy no hay platos publicados"
>
  <div className="grid ...">
    {platosDeHoy.map((plato) => <PlatoCard key={plato.id} ... />)}
  </div>
</ContenidoAsync>
```

Para explicar en la expo: es **composición con `children`** (el componente envuelve el contenido sin saber qué es), se reutiliza en unas 7 vistas, respeta "una sola funcionalidad por componente" y es un componente tonto. Antes de escribirlo, revisar los nombres exactos de las props de `LoadingState`, `ErrorState` y `EmptyState`.

### 2.b — Funciones auxiliares de texto y estilo, fuera del JSX

Los ternarios que eligen un texto o una clase según un valor pasan a una constante objeto arriba del componente:

```jsx
const CLASE_POR_ESTADO = {
  PENDIENTE: 'badge-warn',
  ENTREGADO: 'badge-ok',
  CANCELADO: 'badge-danger',
}
// en el JSX: className={CLASE_POR_ESTADO[estado] ?? 'badge-neutral'}
```

Candidatos: `OrderCard`, `OrderTrack`, `PublicationRow`, `SubPedidoCard` y `Admin`. Regla: **un ternario por expresión como máximo**. Con dos o más condiciones, se usa un `if` antes del `return` o una función auxiliar.

**Sub-pasos:** 2.1 `ContenidoAsync` en `Inicio` → 2.2 `Catalogo` y `MisPublicaciones` → 2.3 `Checkout`, `PublicarPlato` y `Admin` → 2.4 objetos de mapeo.

## Paso 3 — Achicar `App.jsx` (789 líneas, `AppContent` con 22 props)

### 3.1 — `BrowserRouter` a `main.jsx` y eliminar `AppContent` (el que más impacta)

- `main.jsx` queda como en la demo de la profe: `<BrowserRouter><App /></BrowserRouter>`. Es el **único** cambio en `main.jsx`.
- Como `App` pasa a estar **dentro** del router, puede usar `useNavigate` y `useLocation` directamente. Entonces `AppContent` deja de hacer falta: su JSX, `salir` y `agregarSegunSesion` se mueven a `App`, y desaparecen las 22 props que solo se reenviaban.
- Concepto para explicar: un hook de Router solo funciona en un componente que está **dentro** de `<BrowserRouter>`. Antes, `App` lo contenía y por eso hacía falta un hijo intermedio (`AppContent`).
- Actualizar el `CLAUDE.md`: la decisión #2 pasa a "en `main.jsx`", y la regla 3.1 queda como "no tocar `main.jsx` salvo el `BrowserRouter`".
- Probar: todas las rutas, el login con vuelta a la ruta de origen, el logout que navega al inicio y "agregar a la cesta" sin sesión.

### 3.2 — Bajar el estado del chef a su vista

- Se queda en `App.jsx` (compartido): sesión, cesta, toast, `iniciarSesion`, `cerrarSesion`, `sesionVencida`, `agregar`, `cambiarCantidad`, `quitar`, `vaciar` y `pedidoCreado`.
- Pasan a `views/MisPublicaciones.jsx`, con su GET: `misPlatos`, `cargandoMisPlatos`, `errorMisPlatos`, `guardarCambios`, `ajustarStock`, `pausarOReactivar`, `aplicarDescuento` y `eliminarPlato`.
- `PublicarPlato` en modo edición (`/publicar/:id`) pide el plato con `GET /platos/{id}` en su `useEffect([id])`. Como el backend es del equipo, asegurar que devuelva el plato al dueño aunque esté en borrador o pausado.
- Después de crear o editar, se navega a `/mis-publicaciones`. Ese GET es el de una vista que se monta, no un re-GET después de escribir. Tenerlo preparado por si la profe pregunta.
- Sub-pasos: mover el estado y el GET → mover los handlers → `PublicarPlato` con su propio GET → limpiar props y comentarios. Probar el flujo del chef después de cada uno.

## Paso 4 — Vista Perfil

- Endpoints: `GET /users/me` y `PUT /users/me` (`nombre`, `apellido` y `email`, todos obligatorios; un email repetido da 400).
- **Cambio de contraseña:** hoy no hay endpoint. Como el backend es del equipo, se puede agregar (ej. `PUT /users/me/password` con `{ actual, nueva }`). Si no llega, queda afuera.
- Ruta `/perfil` protegida para los 3 roles, con un link en el `Header`.
- `views/Perfil.jsx`: GET al montar, formulario controlado con `FormField`, validación en el estado y `PUT` en el submit.
- Después del `PUT`: actualizar el estado local con la respuesta y avisar a `App.jsx` con `onPerfilActualizado(usuario)` para refrescar el nombre del `Header`. Sin re-GET.
- Errores: 400 muestra el mensaje junto al campo, 401 llama a `sesionVencida()` y la red caída muestra `ErrorState`.

## Paso 5 — Detalle de usuario en Admin

- `GET /users/{userId}` y `PUT /users/{userId}` (nombre, apellido y email).
- Click en una fila de usuarios: se abre un `Dialog` con los datos y un formulario de edición.
- Después del `PUT`: `setUsuarios((actuales) => actuales.map((u) => u.id === editado.id ? editado : u))`.

## Paso 6 — Subcarpetas en `components/`

- `comunes/`: Button, Dialog, Toast, FormField, EmptyState, LoadingState, ErrorState, ContenidoAsync, Tabs, Pagination, Alert.
- `layout/`: Header, Footer, Logo, Hero3D.
- `platos/`: PlatoCard, Gallery, IngredientTrace, IngredientRows, ReviewList, CategoryChips, CategoryPicker, FilterChips, SearchBar, ChefCard.
- `cesta/`: CartItem, QuantityStepper, OrderSummary, DomicilioPicker, DomicilioForm.
- `pedidos/`: OrderCard, OrderTrack, SubPedidoCard.
- `chef/`: PublicationRow, ImageUrlList.
- `auth/`: RoleOption, RutaProtegida.

Es puro movimiento de archivos e imports, sin cambiar lógica, y va en **un solo commit**. Conviene hacerlo **antes** de crear `ContenidoAsync` y `NoEncontrado`, así nacen en su carpeta; o al final de todo, para no generar conflictos con otros miembros del equipo. Acordarlo con el equipo.

## Paso 7 — Guion de demo para la exposición

1. Recorrido como CLIENTE: catálogo con filtros → detalle → agregar a la cesta → checkout → mis pedidos → cancelar.
2. Con DevTools en Network: mostrar que después de agregar o cancelar **no hay un GET de la lista**.
3. Token vencido o borrado: una ruta privada lleva a `/ingreso` y, después del login, vuelve a la ruta de origen.
4. CHEF que intenta comprar: Toast "Solo los clientes pueden comprar".
5. Backend apagado: `ErrorState` con un mensaje claro.
6. `/cualquier-cosa` muestra la 404.
7. Respuestas preparadas: dónde vive el estado compartido y por qué (sin Context hasta la 3.ª), por qué `ContenidoAsync`, por qué `BrowserRouter` en `main.jsx`, y por qué el `fetch` está escrito en cada vista (estilo de la profe, sin helpers).

## Paso 8 — Subida de imágenes multipart (front + back)

**Backend** (basado en la demo de la profe, `ImagesController`): un endpoint que reciba `MultipartFile` (ej. `POST /platos/{id}/imagenes`) y devuelva la URL o el id de la imagen. Lo define el equipo de back: el front espera el contrato antes de empezar.

**Front** (en `PublicarPlato`, reemplaza o convive con `ImageUrlList`):
- `<input type="file" accept="image/*" name="imagen" onChange={...} />` controlado: se guarda `event.target.files[0]` en el estado.
- En el handler del submit: `const datos = new FormData()`, después `datos.append('file', archivo)`, y por último `fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: datos })`.
- ⚠ **No poner `Content-Type`**: el navegador lo arma solo con el `boundary` del multipart. Si se pone a mano, el backend no puede leer el archivo.
- Flujo sugerido: primero se crea el plato (POST JSON, como hoy), después se suben las imágenes con el id devuelto, y por último se actualiza el estado local con lo que responde el backend.
- Conceptos nuevos para explicar: `FormData`, `multipart/form-data` y por qué no se manda JSON.

## Checklist al cerrar cada paso

- `npm run lint` y `npm run build` sin errores.
- La búsqueda de patrones prohibidos (sección 10 del `CLAUDE.md`) sigue limpia.
- Los componentes nuevos no tienen `fetch` ni datos propios.
- Probado en móvil y en escritorio.
- Actualizar la hoja de ruta del `CLAUDE.md`.

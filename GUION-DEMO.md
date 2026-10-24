# Guion de demo — Appetitos (2.ª entrega, 26/10)

Guion para la exposición. Cada escena dice **qué hacer**, **qué mostrar** y **qué decir**. Ensayalo con el backend real antes del día: varias cosas de este guion solo se probaron con un servidor de mentira.

## Antes de empezar (checklist)

- [ ] Backend levantado en `http://localhost:4002`, con CORS para `http://localhost:5173`, categorías e ingredientes cargados y platos publicados.
- [ ] Tres cuentas listas: un **CLIENTE**, un **CHEF** (con al menos un plato publicado) y un **ADMIN** (cargado a mano en la base).
- [ ] Front con `npm run dev` y el navegador en `http://localhost:5173`. Cerrá sesión para arrancar limpio.
- [ ] DevTools abierto en la pestaña **Network** (filtro Fetch/XHR) y en **Application → Local Storage**.
- [ ] Un plato con stock bajo, para mostrar el error de stock si alcanza el tiempo.

## Escena 1 — Recorrido del CLIENTE (5 min)

1. **Catálogo:** entrá a `/catalogo`. Filtrá por nombre, por categoría y por rango de precio. Mostrá "Limpiar filtros" y "Ver más".
   - Decir: "Los filtros viajan como query params a `GET /platos`. El orden y la paginación los hacemos en la vista porque la API no los tiene."
2. **Detalle:** abrí un plato (`/plato/:id`). Mostrá galería, ingredientes y reseñas.
3. **Agregar a la cesta:** sin sesión, tocá "Agregar" → te lleva a `/ingreso`. Ingresá como CLIENTE → volvés a la misma página. Agregá el plato.
4. **Cesta y checkout:** cambiá una cantidad, quitá un ítem, seguí al checkout. Elegí o creá un domicilio y confirmá el pedido.
5. **Mis pedidos:** abrí `/pedidos`. Mostrá el seguimiento (`OrderTrack`) y cancelá un pedido en estado Pendiente.

## Escena 2 — Sin GET repetidos (Network)

Con DevTools en Network, repetí un par de acciones y señalá la lista de pedidos:

- Agregar a la cesta → un solo `POST /carrito/items`; la respuesta trae la cesta completa y se guarda tal cual.
- Cambiar cantidad → un solo `PUT`. Quitar un ítem → un solo `DELETE`.
- Cancelar un pedido → un solo `PATCH`; la pantalla se actualiza sin ningún `GET /orders` después.
- Decir: "Después de cada escritura actualizamos el estado local con lo que devuelve el backend. No volvemos a pedir la colección."

## Escena 3 — Sesión vencida (2 min)

1. Con sesión iniciada, andá a `/pedidos`.
2. En **Application → Local Storage** cambiá a mano el valor de `jwtToken` por cualquier texto, y recargá (F5).
3. Resultado: la app intenta restaurar la sesión con `GET /users/me`, recibe 401, borra el token y queda sin sesión.
4. Entrá a `/pedidos` otra vez: te manda a `/ingreso`. Ingresá y volvés a `/pedidos`.
   - Decir: "`RutaProtegida` guarda la ruta de origen en el `state` del router y el login la usa para volver."
   - Decir: "Una escritura con token vencido también cierra la sesión: es el mismo `sesionVencida()` de `App`."

## Escena 4 — Roles: el CHEF no compra (1 min)

1. Ingresá como CHEF y andá al catálogo. Tocá "Agregar" en un plato.
2. Resultado: Toast "Solo los clientes pueden comprar".
   - Decir: "La decisión vive en `agregarSegunSesion` de `App`; las tarjetas no saben nada de sesiones."

## Escena 5 — Vistas del CHEF y del ADMIN (4 min)

1. **CHEF → Mis publicaciones:** ajustá el stock, pausá un plato, aplicale un descuento.
2. **CHEF → Publicar un plato:** cargá nombre, precio, stock, imágenes por URL, categorías e ingredientes. Guardalo.
3. **CHEF → Pedidos recibidos:** avanzá el estado de un subpedido.
4. **Perfil (cualquier rol):** hacé clic en tu nombre del Header. Editá el nombre y guardá: el Header se actualiza solo. Probá un correo ya usado y mostrá el error junto al campo.
5. **ADMIN → `/admin`:** en **Pagos** aprobá el pago de un cliente. En **Usuarios** abrí "Ver y editar" y cambiá un nombre.

## Escena 6 — Backend apagado (1 min)

1. Apagá el backend y recargá `/catalogo` o `/`.
2. Resultado: `ErrorState` con "No pudimos conectar con el servidor...". No aparece "Failed to fetch".
   - Decir: "Distinguimos un error de red (la promesa se rechaza sin `status`) de un error HTTP (hay que mirar `response.ok`)."
3. Prendé el backend de nuevo.

## Escena 7 — Ruta inexistente (30 s)

Escribí `/cualquier-cosa` en la barra. Resultado: la vista 404 con su botón al inicio, dentro del mismo layout.

- Decir: "Es `path="*"` al final de las rutas: coincide con todo lo que no coincidió antes."

## Respuestas preparadas

**¿Dónde vive el estado compartido y por qué?**
En `App.jsx`: sesión, cesta, aviso (Toast) y sus funciones. Las vistas lo reciben por props y avisan hacia arriba con funciones (`onAdd`, `onSesionVencida`...). No usamos Context porque la profesora no lo confirmó; en la 3.ª entrega pasa a Redux.

**¿Por qué `ContenidoAsync`?**
Antes había ternarios anidados de 4 niveles para elegir entre cargando, error, vacío y datos. `ContenidoAsync` los resuelve con `if` y `return` y recibe lo que se muestra por `children`. Es un componente "tonto" y se reutiliza en Inicio, Catálogo, Mis publicaciones y Perfil. Donde había más de un ternario anidado usamos funciones auxiliares.

**¿Por qué `BrowserRouter` en `main.jsx`?**
Es como lo mostró la profesora en su demo. Además, así `App` queda dentro del router y puede usar `useNavigate` y `useLocation` directamente, y sacamos el componente intermedio `AppContent` con sus 22 props.

**¿Por qué el `fetch` está escrito en cada vista y no en un helper?**
Seguimos el estilo de la profesora (su `PostList` hace el `fetch` directo) y la regla de que no hay carpeta de servicios. Cada bloque es la plantilla aprobada: se lee `response.ok`, se lanza un error con el `message` del backend y se guarda `cuerpo.data`.

**¿Cómo manejan el JWT?**
Se guarda `data.access_token` en `localStorage` con la clave `jwtToken` y en el estado de `App`. Se lee solo al iniciar (para restaurar la sesión con `GET /users/me`) y se borra solo al cerrar sesión o con un 401. Las rutas públicas no mandan el token, porque uno vencido da 401 incluso ahí. En la 3.ª entrega pasa a Redux.

**¿Por qué los POST no van en `useEffect`?**
Porque React Strict Mode ejecuta los efectos dos veces en desarrollo y un POST se duplicaría. Los POST, PUT, PATCH y DELETE van en el handler del evento.

**Después de crear un plato vuelven a pedir la lista: ¿no es un GET repetido?**
No. `PublicarPlato` hace un solo `POST` y navega; `MisPublicaciones` se monta de nuevo y pide `GET /platos/mis-platos`, que es el GET de una vista que se abre. La regla de la profesora prohíbe volver a pedir la colección *después de escribir en la misma pantalla*; acá la pantalla que escribe y la que lee son distintas. Dentro de `MisPublicaciones`, cada escritura (stock, descuento, eliminar) actualiza la lista local con `map` o `filter` sin ningún GET.

**¿Por qué el estado del chef vive en `MisPublicaciones` y no en `App`?**
Porque solo esa vista lo usa. `App` guarda lo compartido (sesión, cesta, aviso). Antes estaba en `App` porque el backend no devolvía borradores y esa memoria era la única fuente; con `GET /platos/mis-platos` la fuente es el backend.

**¿Por qué las carpetas dentro de `components/`?**
Para ordenar 37 componentes por dominio (`comunes`, `layout`, `platos`, `cesta`, `pedidos`, `chef`, `auth`). La regla prohíbe carpetas nuevas en `src/`, no dentro de `components/`.

## Límites conocidos (decirlos antes de que pregunten)

- **Imágenes solo por URL:** el backend no tiene subida de archivos. La subida multipart está en el plan, pero depende de un endpoint que todavía no existe.
- **Cambio de contraseña:** no hay endpoint, así que la vista Perfil edita nombre, apellido y correo.
- **Un ADMIN no puede cambiar el rol de un usuario existente:** la API ignora el rol en `PUT /users/{id}`.
- **Sesión en `localStorage`:** es transitorio; la 3.ª entrega lo reemplaza con Redux.

## Sin verificar contra el backend real (ensayar)

Estas cosas se probaron en el navegador con un servidor de mentira o no se probaron:

- Login con vuelta a la ruta de origen, logout que navega al inicio y agregar a la cesta sin sesión (se movieron en el Paso 3.1).
- Vista Perfil y detalle de usuario en Admin (probados solo con servidor de mentira).
- Casos con datos y vacíos de `ContenidoAsync` en Inicio, Catálogo y Mis publicaciones.
- Un 401 en las escrituras y los 400 de stock en el checkout.

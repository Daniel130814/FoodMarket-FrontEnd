# FoodMarket Backend – Inventario de la API REST

Generado leyendo el código (controllers, DTOs, entidades, servicios, seguridad, `application.properties`).
Convención: **NO EXISTE** = revisado y no está en el código. **NO CONFIRMADO** = no se puede afirmar solo leyendo el código.

---

## 1. Datos generales

| Ítem                    | Valor                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Puerto                  | `4002` (`server.port=4002`)                                                                                                                                               |
| URL base                | `http://localhost:4002`                                                                                                                                                   |
| Prefijo global (`/api`) | **NO EXISTE**. Cada controller tiene su propia ruta raíz: `/platos`, `/users`, `/carrito`, etc. Solo auth usa `/api/v1/auth`                                              |
| Java / Spring Boot      | Java 21, Spring Boot 4.1.0, Maven                                                                                                                                         |
| Base de datos           | MySQL. `DB_URL` (def. `jdbc:mysql://localhost:3306/marketplace`), `DB_USERNAME` (def. `root`), `DB_PASSWORD` (def. vacío). `ddl-auto=update` (crea/actualiza tablas solo) |
| Swagger / OpenAPI       | **NO EXISTE** (no hay springdoc ni anotaciones OpenAPI)                                                                                                                   |
| Actuator                | La dependencia está, pero no hay config de exposición; igual cae bajo `anyRequest().authenticated()` (requiere token)                                                     |
| Datos semilla (seed)    | **NO EXISTE** (no hay `data.sql` ni runner). No hay ADMIN inicial: hay que insertarlo en la BD a mano                                                                     |

### Cómo levantarlo

1. MySQL corriendo y base `marketplace` creada (o apuntar `DB_URL` a otra).
2. **Variable de entorno obligatoria `JWT_SECRET`** (sin default: si falta, la app no arranca). Debe tener al menos 32 caracteres/bytes (HS256).
3. Opcional: `JWT_EXPIRATION` (ms, default `86400000` = 24 h), `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
4. Desde la carpeta `foodmarketplace/`: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`).

### CORS

**NO EXISTE configuración de CORS**: no hay `@CrossOrigin`, ni `CorsConfigurationSource`, ni `.cors(...)` en `SecurityConfig` (búsqueda de "cors" sin resultados).
Consecuencia: **no se permite `http://localhost:5173` (ni ningún origen)**. Un `fetch` desde React/Vite va a fallar en el navegador (preflight `OPTIONS` sin headers CORS).
Workaround para el front mientras tanto: proxy de Vite (`server.proxy` apuntando a `http://localhost:4002`). Fix definitivo: pedir al backend que agregue CORS (origen `http://localhost:5173`, métodos `GET,POST,PUT,PATCH,DELETE,OPTIONS`, headers `Authorization,Content-Type`).

### Formato general de respuesta

Todas las respuestas (éxito y error) usan el sobre:

```json
{ "success": true, "message": "Texto legible", "data": {} }
```

- Listas vacías devuelven `200` con `"data": null` (no `[]`) y un `message` tipo "No hay ...". El front debe tratar `null` como lista vacía.
- Los `POST createX` devuelven `201` + header `Location`.
- Fechas (`LocalDateTime`): sin zona horaria; formato de serialización exacto **NO CONFIRMADO** (esperable ISO-8601, ej. `2026-10-19T14:30:00`).
- No hay paginación ni ordenamiento en ningún endpoint (**NO EXISTE**; ver sección 6).

### Formato de error

```json
{ "success": false, "message": "Mensaje de error", "data": null }
```

| HTTP | Cuándo                                                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400  | Validación de body (`message` = `campo: mensaje, campo2: mensaje2`), JSON malformado/enum inválido (`"La solicitud contiene un valor inválido"`), reglas de negocio, usuario duplicado, carrito vacío, cantidad/calificación inválida                                             |
| 401  | Sin token / token inválido o vencido / login incorrecto. `"Necesitás iniciar sesión para realizar esta operación"`                                                                                                                                                                |
| 403  | Rol insuficiente o recurso de otro usuario. `"No tenés permisos para realizar esta operación"` / `"No tenés acceso a un recurso de otro usuario"`                                                                                                                                 |
| 404  | Recurso inexistente (usuario, plato, pedido, pago, domicilio, ingrediente, categoría, reseña, perfil de chef, subpedido, item de carrito)                                                                                                                                         |
| 409  | Conflictos: reseña duplicada, recurso en uso, estados inválidos, categoría/ingrediente duplicado, pago duplicado/aprobado, orden cancelada                                                                                                                                        |
| 500  | Cualquier excepción no mapeada: `"Ocurrió un error interno al procesar la solicitud"`. Ojo: por el handler genérico, probablemente también devuelven 500 una ruta inexistente, un método HTTP no soportado o un path param no numérico (NO CONFIRMADO, no hay handler específico) |

---

## 2. Autenticación y roles

### JWT

- Registro: `POST /api/v1/auth/register` → `201`.
- Login: `POST /api/v1/auth/authenticate` → `200`.
- Ambos devuelven en `data`:

```json
{ "access_token": "eyJhbGciOi...", "userId": 7, "role": "CLIENTE" }
```

(Los campos son exactamente `access_token`, `userId`, `role`; no hay refresh token ni `expiresIn`.)

- Header esperado: `Authorization: Bearer <access_token>`.
- Duración: `JWT_EXPIRATION` ms, **default 24 h** (86 400 000 ms). Algoritmo HMAC con `JWT_SECRET`. El token solo lleva `sub` (username), `iat`, `exp`; **el rol no va en el token** (se lee de la BD en cada request), por eso hay que guardar `role` de la respuesta de login.
- Token vencido/inválido → 401 en cualquier ruta (incluso en rutas públicas, si se manda el header).
- Sesión stateless, CSRF deshabilitado.
- El `username` se normaliza (trim + minúsculas) tanto en registro como en login. Email también (trim + minúsculas).

**POST /api/v1/auth/register** — body:

| Campo      | Tipo   | Oblig. | Validación                                       |
| ---------- | ------ | ------ | ------------------------------------------------ |
| username   | string | sí     | `@NotBlank`, 3–50 caracteres                     |
| nombre     | string | sí     | `@NotBlank`                                      |
| apellido   | string | sí     | `@NotBlank`                                      |
| email      | string | sí     | `@NotBlank`, `@Email`                            |
| password   | string | sí     | `@NotBlank`, mínimo 8                            |
| tipoCuenta | enum   | sí     | `CLIENTE` o `CHEF` (no se puede registrar ADMIN) |

Errores: 400 validación; 400 `"El usuario que se intenta agregar ya existe"` (username o email repetido; **es 400, no 409**).

**POST /api/v1/auth/authenticate** — body: `{ "username": "...", "password": "..." }` (ambos `@NotBlank`). Credenciales incorrectas → 401.

### Roles (nombres exactos)

`CLIENTE` (comprador), `CHEF` (vendedor), `ADMIN`. Las authorities son el nombre del rol sin prefijo `ROLE_`.

### Tabla de acceso (según `SecurityConfig`, en orden de evaluación)

| Ruta / método                                                                              | Acceso                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `/api/v1/auth/**`                                                                          | Público                                                  |
| `GET /platos/**`, `/chef-profiles/**`, `/resenas/**`, `/categories/**`, `/ingredientes/**` | Público                                                  |
| `GET /platos/mis-platos`                                                                   | CHEF (se evalúa ANTES de la regla pública `GET /platos/**`) |
| `GET /imagenes/**`                                                                         | Público                                                  |
| `/users/me` (GET, PUT), `PUT /users/me/password`                                           | Cualquier usuario con token                              |
| `/users/**` (resto, incluye `PATCH /users/{userId}/role`)                                  | ADMIN                                                    |
| `POST /platos/**` (incluye `POST /platos/{platoId}/imagenes`)                              | CHEF                                                     |
| `PUT/PATCH/DELETE /platos/**`                                                              | CHEF o ADMIN (+ ownership en el servicio)                |
| `POST /chef-profiles/**`                                                                   | CHEF                                                     |
| `PUT /chef-profiles/**`                                                                    | CHEF o ADMIN (+ ownership)                               |
| `POST/PUT/DELETE /categories/**`, `/ingredientes/**`                                       | ADMIN                                                    |
| `POST /resenas/**`                                                                         | CLIENTE                                                  |
| `PUT/DELETE /resenas/**`                                                                   | CLIENTE o ADMIN (+ ownership)                            |
| `POST /domicilios/**`, `/orders/**`, `/pagos/**`                                           | CLIENTE                                                  |
| `GET/PUT/DELETE/PATCH /domicilios/**`, `/orders/**`                                        | CLIENTE o ADMIN (+ ownership)                            |
| `PATCH /pagos/**`                                                                          | ADMIN                                                    |
| `GET /pagos/**`                                                                            | CLIENTE o ADMIN (+ ownership)                            |
| `/subpedidos/**`                                                                           | CHEF o ADMIN (+ ownership)                               |
| `/carrito/**`                                                                              | CLIENTE (el servicio además rechaza otros roles con 403) |
| Cualquier otra ruta (incl. `/actuator/**`)                                                 | Token                                                    |

"+ ownership": además del rol, el servicio verifica que el recurso sea del usuario (o que sea ADMIN); si no → 403.

---

## 3. Endpoints por recurso

Notación: 🌐 público · 🔑 cualquier token · rol entre corchetes. Todos devuelven el sobre `{success,message,data}`; abajo solo se muestra `data`.

### 3.1 Auth

Ver sección 2.

### 3.2 Usuarios (`/users`)

| Método y ruta            | Acceso | Descripción                                              |
| ------------------------ | ------ | -------------------------------------------------------- |
| `GET /users/me`          | 🔑     | Usuario autenticado                                      |
| `PUT /users/me`          | 🔑     | Edita nombre, apellido, email propios                    |
| `GET /users`             | ADMIN  | Lista de usuarios (`data:null` si vacío)                 |
| `GET /users/{userId}`    | ADMIN  | 404 si no existe                                         |
| `POST /users/createUser` | ADMIN  | Crea usuario con cualquier rol (incluido ADMIN). 201     |
| `PUT /users/{userId}`    | ADMIN  | Edita nombre, apellido, email (no el rol ni el username) |
| `PUT /users/me/password` | 🔑     | Cambia la contraseña propia (nuevo, 24/10)               |
| `PATCH /users/{userId}/role` | ADMIN | Cambia el rol de un usuario existente (nuevo, 24/10) |

**`PUT /users/me/password`** — body `{ "actual": string, "nueva": string (mínimo 8) }`. `200` con `message: "Contraseña actualizada correctamente"` y `data: null`; el token vigente sigue siendo válido. `400` si `actual` es incorrecta (`"La contraseña actual es incorrecta"`) o la validación falla (`nueva` corta, campos en blanco). `401` sin token.

**`PATCH /users/{userId}/role`** — body `{ "role": "CLIENTE" | "CHEF" | "ADMIN" }` (obligatorio). `200` con `UserResponse` (`message: "Rol del usuario actualizado correctamente"`). El rol reemplaza al anterior; el mismo JWT usa el rol nuevo en la siguiente solicitud (las authorities se recargan en cada pedido). Repetir el rol actual da `200` sin cambios. Errores: `400` falta `role` o es desconocido, o un ADMIN intenta quitarse su propio rol de ADMIN; `403` si el solicitante no es ADMIN; `404` el usuario no existe; `409` si se saca el rol CHEF a alguien con platos `PUBLICADO`/`AGOTADO` o subpedidos `PENDIENTE`/`CONFIRMADO`/`EN_PREPARACION`/`ENVIADO` (`"No se puede quitar el rol CHEF mientras tenga platos publicados o agotados, o subpedidos sin terminar"`).

**Respuesta `UserResponse`:**

```json
{
  "id": 7,
  "username": "juan",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@mail.com",
  "role": "CLIENTE"
}
```

**Body `PUT /users/me` y `PUT /users/{id}`** (`UserUpdateRequest`): `nombre` (`@NotBlank`), `apellido` (`@NotBlank`), `email` (`@NotBlank @Email`). Email repetido de otro usuario → 400 `"El usuario que se intenta agregar ya existe"`.

**Body `POST /users/createUser`** (`UserRequest`): `username` (3–50), `nombre`, `apellido`, `email`, `password` (min 8), `role` (`@NotNull`, enum `Role`). Mismos errores que register.

### 3.3 Platos (`/platos`)

| Método y ruta                        | Acceso             |
| ------------------------------------ | ------------------ |
| `GET /platos`                        | 🌐                 |
| `GET /platos/{platoId}`              | 🌐 (token opcional; ver abajo) |
| `GET /platos/mis-platos`             | CHEF (nuevo, 24/10) |
| `POST /platos/createPlato`           | CHEF               |
| `POST /platos/{platoId}/imagenes`    | CHEF dueño (nuevo, 24/10) |
| `PUT /platos/{platoId}`              | CHEF dueño o ADMIN |
| `DELETE /platos/{platoId}`           | CHEF dueño o ADMIN |
| `PATCH /platos/{platoId}/descuento`  | CHEF dueño o ADMIN |
| `DELETE /platos/{platoId}/descuento` | CHEF dueño o ADMIN |

**`GET /platos`** — query params (todos opcionales): `nombre` (string, búsqueda; el trim se aplica; semántica exacta de coincidencia —parcial/exacta— **NO CONFIRMADO**, está en una `@Query` del repositorio), `categoriaId` (Long; 404 si no existe), `precioMin`, `precioMax` (decimales). Validaciones (400): precios negativos, `precioMin > precioMax`. Sin ordenamiento ni paginación.

- **Solo devuelve platos en estado `PUBLICADO` o `AGOTADO`.** Los `BORRADOR` y `PAUSADO` no aparecen acá (para verlos, el chef usa `GET /platos/mis-platos`).
- Respuesta: `200`, `data` = array de `PlatoResponse` (o `null` si no hay).

**`GET /platos/mis-platos`** (CHEF, nuevo) — los platos del chef autenticado en **todos** los estados (`BORRADOR`, `PUBLICADO`, `AGOTADO`, `PAUSADO`), el más nuevo primero. `200` con `data: PlatoResponse[]` (`message: "Platos obtenidos correctamente"`) o `data: null` si no tiene ninguno (`message: "No tenés platos cargados"`). `401` sin token, `403` si no es CHEF. Verificado contra el backend real (24/10).

**`GET /platos/{platoId}`** — ruta pública con token opcional. `PUBLICADO`/`AGOTADO`: `200` para cualquiera. `BORRADOR`/`PAUSADO`: `200` solo con el token del **chef dueño** o de un **ADMIN**; sin token, con otro chef o con un cliente es `404 "El plato indicado no existe"`. Un token inválido o vencido sigue dando `401`, incluso en esta ruta pública. `404` también si no existe.

**`POST /platos/{platoId}/imagenes`** (CHEF dueño, nuevo) — `multipart/form-data` con el campo **`file`** (`image/jpeg`, `image/png` o `image/webp`; se valida también la firma real del archivo; máximo 5 MB). `201` con el `PlatoResponse` completo y la URL nueva **absoluta** (por ejemplo `http://localhost:4002/imagenes/<uuid>.png`) agregada al final de `imagenesUrls`. Errores: `400` formato no permitido, contenido que no coincide, archivo de más de 5 MB, archivo vacío o falta el campo `file`; `401` sin token; `403` si no es CHEF o no es el dueño (un ADMIN tampoco puede subir); `404` si el plato no existe. Orden de los chequeos: 404 → 403 → 400. El front **no** debe mandar `Content-Type` a mano (el navegador arma el `boundary` del multipart). El `PUT /platos/{id}` **reemplaza** `imagenesUrls` completo: al editar un plato con imágenes subidas hay que reenviar esas URLs o se pierden. Un plato `PUBLICADO`/`AGOTADO` exige al menos una imagen, un `BORRADOR` no. No hay límite de imágenes por plato y `PUT`/`DELETE` no borran los archivos del disco.

**`GET /imagenes/{nombre}`** (público, nuevo) — devuelve el archivo (no JSON) con su `Content-Type` real (`image/jpeg|png|webp`) y `Cache-Control` de 30 días; se usa directo en `<img src>`. `404` en JSON si no existe.

**`DELETE /platos/{platoId}`** — `200` con `data: null` y un `message` que ahora dice qué pasó: `"Plato eliminado"` (se borró) o `"Plato pausado porque tiene historial"` (quedó `PAUSADO`).

**`PlatoResponse`:**

```json
{
  "id": 12,
  "nombre": "Milanesa napolitana",
  "descripcion": "Con papas",
  "imagenesUrls": ["https://.../foto1.jpg"],
  "precio": 5000.0,
  "descuentoPorcentaje": 10.0,
  "precioConDescuento": 4500.0,
  "stockDisponible": 20,
  "estado": "PUBLICADO",
  "chefId": 3,
  "categorias": ["Carnes", "Argentina"],
  "ingredientes": [
    {
      "ingredienteId": 1,
      "nombre": "Carne",
      "cantidad": 300.0,
      "unidadMedida": "GRAMOS"
    }
  ]
}
```

Nota: `categorias` devuelve las **descripciones** (strings), no los ids.

**Body `POST /platos/createPlato` y `PUT /platos/{id}`** (`PlatoRequest`):

| Campo           | Tipo               | Oblig. | Validación / regla                                                                                                                |
| --------------- | ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| nombre          | string             | sí     | `@NotBlank`                                                                                                                       |
| descripcion     | string             | no     | —                                                                                                                                 |
| precio          | decimal            | sí     | `@NotNull @Positive`                                                                                                              |
| stockDisponible | integer            | sí     | `@NotNull @PositiveOrZero`                                                                                                        |
| estado          | enum `EstadoPlato` | no     | Ver reglas                                                                                                                        |
| imagenesUrls    | string[]           | no     | cada elemento `@NotBlank`                                                                                                         |
| categoriasIds   | long[]             | no     | cada id debe existir (404 si no)                                                                                                  |
| ingredientes    | objeto[]           | no     | `{ingredienteId (@NotNull), cantidad (@NotNull @Positive), unidadMedida (@NotNull, enum)}`; no se puede repetir ingrediente (400) |

Reglas de negocio:

- Crear: el creador debe ser CHEF; queda como dueño (`chefId`). Estado por defecto `BORRADOR`.
- `PUT` es **reemplazo total**: `imagenesUrls`, `categoriasIds` o `ingredientes` en `null`/ausentes **borran** lo existente. `estado` ausente conserva el actual.
- Si se manda `estado` `PUBLICADO` o `AGOTADO`, el backend lo recalcula: stock 0 → `AGOTADO`, si no → `PUBLICADO`. `BORRADOR`/`PAUSADO` se respetan.
- Sin `estado` en un PUT: `PUBLICADO` con stock 0 pasa a `AGOTADO`; `AGOTADO` con stock > 0 pasa a `PUBLICADO`.
- Un plato `PUBLICADO`/`AGOTADO` debe tener al menos 1 imagen → si no, 400 `"Un plato publicado debe tener al menos una imagen"`.
- Solo el chef dueño (o ADMIN) puede editar/borrar/descontar → si no, 403.
- Otro chef intentando `POST`: 403 `"Solo un CHEF puede crear platos"` (si fuera otro rol, ya lo corta la seguridad).

Respuestas: `POST` 201 + `PlatoResponse`; `PUT` 200 + `PlatoResponse`.

**`DELETE /platos/{platoId}`** — 200, `data:null`, mensaje `"Plato eliminado o pausado correctamente"`. Si el plato tiene pedidos, reseñas o está en algún carrito, **no se borra: pasa a `PAUSADO`** (soft delete); si no, se elimina físicamente. El front no recibe cuál de las dos pasó.

**`PATCH /platos/{id}/descuento`** — body `{ "porcentaje": 15.5 }` (`@NotNull`, `@DecimalMin 0.0`, `@DecimalMax 99.99`). 200 + `PlatoResponse`. El precio base no se modifica; `precioConDescuento = precio × (100 − %) / 100`, 2 decimales. **`DELETE /platos/{id}/descuento`** pone el descuento en 0 (200 + `PlatoResponse`).

### 3.4 Categorías (`/categories`)

| Método y ruta                     | Acceso |
| --------------------------------- | ------ |
| `GET /categories`                 | 🌐     |
| `GET /categories/{id}`            | 🌐     |
| `POST /categories/createCategory` | ADMIN  |
| `PUT /categories/{id}`            | ADMIN  |
| `DELETE /categories/{id}`         | ADMIN  |

Body: `{ "description": "Carnes" }` (`@NotBlank`; el `id` del DTO se ignora). Respuesta `data`: `{ "id": 1, "description": "Carnes" }` (la lista usa el mismo objeto). `POST` 201.
Errores: 409 `"Ya existe una categoría con ese nombre"` (case-insensitive), 404 `"La categoria indicada no existe"`, 409 al borrar si está asignada a algún plato (`"No se puede eliminar una categoria asignada a uno o mas platos"`).

### 3.5 Ingredientes (`/ingredientes`)

| Método y ruta                                 | Acceso |
| --------------------------------------------- | ------ |
| `GET /ingredientes`, `GET /ingredientes/{id}` | 🌐     |
| `POST /ingredientes/createIngrediente`        | ADMIN  |
| `PUT /ingredientes/{id}`                      | ADMIN  |
| `DELETE /ingredientes/{id}`                   | ADMIN  |

Body: `{ "nombre": "Tomate", "descripcion": "Fresco" }` — ambos `@NotBlank`. Respuesta `data`: `{ "id": 1, "nombre": "Tomate", "descripcion": "Fresco" }`. `POST` 201.
Errores: 409 `"Ya existe un ingrediente con ese nombre"`, 404, 409 al borrar si lo usa algún plato.

### 3.6 Perfiles de chef (`/chef-profiles`)

| Método y ruta                                 | Acceso                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `GET /chef-profiles`                          | 🌐                                                                                           |
| `GET /chef-profiles/{id}`                     | 🌐 (el `id` es el id del **perfil**, no del usuario)                                         |
| `GET /chef-profiles/user/{userId}/reputacion` | 🌐 (`data` = número decimal, ej. `4.50`; `0` si no hay reseñas; 404 si el usuario no existe) |
| `POST /chef-profiles`                         | CHEF                                                                                         |
| `PUT /chef-profiles/{id}`                     | CHEF dueño o ADMIN                                                                           |

Body (`POST` y `PUT`): `biografia`, `especialidad`, `fotoUrl`, `descripcion` — todos strings opcionales, **sin validaciones** (biografía y descripción máx. 2000 caracteres por columna).
Respuesta `ChefProfileResponse`:

```json
{
  "id": 1,
  "userId": 3,
  "biografia": "...",
  "especialidad": "Pastas",
  "fotoUrl": "https://...",
  "descripcion": "...",
  "reputacion": 4.5
}
```

`reputacion` = promedio de calificaciones de las reseñas de los platos del chef, 2 decimales.
Reglas: `POST` crea el perfil del chef autenticado; 400 `"El chef ya posee un perfil"` si ya tiene. No hay endpoint "mi perfil" ni "perfil por userId" (hay que listar y filtrar por `userId`).

### 3.7 Carrito (`/carrito`) — solo CLIENTE

| Método y ruta                    | Descripción                                      |
| -------------------------------- | ------------------------------------------------ |
| `GET /carrito`                   | Carrito del cliente (se crea vacío si no existe) |
| `POST /carrito/items`            | Agrega plato                                     |
| `PUT /carrito/items/{itemId}`    | Cambia cantidad                                  |
| `DELETE /carrito/items/{itemId}` | Quita un item (200, `data:null`)                 |
| `DELETE /carrito`                | Vacía el carrito (200, `data:null`)              |
| `POST /carrito/checkout`         | Convierte el carrito en un pedido                |

Bodies:

- `POST /carrito/items`: `{ "platoId": 12, "cantidad": 2 }` — `platoId` `@NotNull`, `cantidad` `@NotNull @Positive`.
- `PUT /carrito/items/{itemId}`: `{ "cantidad": 3 }` — `@NotNull @Positive` (reemplaza, no suma).
- `POST /carrito/checkout`: `{ "domicilioEntregaId": 5 }` — `@NotNull`.

Respuesta `CarritoResponse` (GET y mutaciones de items, todas 200):

```json
{
  "id": 1,
  "items": [
    {
      "id": 10,
      "platoId": 12,
      "nombrePlato": "Milanesa",
      "cantidad": 2,
      "precioBase": 5000.0,
      "descuentoPorcentaje": 10.0,
      "precioUnitarioActual": 4500.0,
      "subtotalEstimado": 9000.0
    }
  ],
  "totalEstimado": 9000.0
}
```

Reglas:

- Agregar un plato ya presente **suma** la cantidad.
- Solo se agregan platos `PUBLICADO` con stock > 0 (si no: 400 `"El plato no está disponible para agregar al carrito"`); la cantidad total no puede superar el stock (400 `"La cantidad solicitada no tiene stock suficiente"`).
- Los precios del carrito se recalculan en cada GET (precio/descuento actual). El stock **no se reserva** en el carrito.
- Checkout: 400 `"El carrito está vacío"`; domicilio inexistente 404; domicilio de otro usuario 403. Descuenta stock (ver 3.8), vacía el carrito y responde `200` con un `OrderResponse` (no 201).
- Item de otro carrito: 403; item inexistente: 404.
- Rol distinto de CLIENTE: 403.

### 3.8 Pedidos (`/orders`)

| Método y ruta                      | Acceso                                     |
| ---------------------------------- | ------------------------------------------ |
| `GET /orders`                      | CLIENTE (solo los propios) / ADMIN (todos) |
| `GET /orders/{orderId}`            | CLIENTE dueño / ADMIN (403 si es de otro)  |
| `POST /orders/createOrder`         | CLIENTE                                    |
| `PATCH /orders/{orderId}/cancelar` | CLIENTE dueño / ADMIN — sin body           |

**Body `POST /orders/createOrder`** (`OrderRequest`):

```json
{ "domicilioEntregaId": 5, "items": [{ "platoId": 12, "cantidad": 2 }] }
```

`domicilioEntregaId` `@NotNull`; `items` `@NotEmpty`; cada item `platoId` `@NotNull`, `cantidad` `@NotNull @Positive`. Es la alternativa directa al checkout del carrito (no toca el carrito). 201.

**Respuesta `OrderResponse`:**

```json
{
  "id": 30,
  "userId": 7,
  "domicilioEntregaId": 5,
  "fechaCreacion": "2026-10-19T14:30:00",
  "estado": "PENDIENTE",
  "precioFinal": 9000.0,
  "pagoBloqueado": false,
  "subPedidos": [
    {
      "id": 50,
      "chefId": 3,
      "chefNombre": "Ana",
      "estado": "PENDIENTE",
      "subtotal": 9000.0,
      "detalles": [
        {
          "id": 70,
          "platoId": 12,
          "platoNombre": "Milanesa",
          "cantidad": 2,
          "precioUnitario": 4500.0,
          "subtotal": 9000.0
        }
      ]
    }
  ]
}
```

Reglas de negocio (crear pedido / checkout):

- Valida que cada plato exista (404), esté `PUBLICADO` (400 `"El plato X no esta publicado"`) y tenga stock suficiente (400 `"Stock insuficiente para el plato X"`).
- **Descuenta el stock en el momento de crear el pedido** (no al pagar); si el stock llega a 0 el plato pasa a `AGOTADO`. Todo en una transacción con lock.
- Aplica el descuento vigente: `precioUnitario` queda congelado en el detalle.
- El pedido se divide en **un subpedido por chef**; el pedido nace `PENDIENTE`.
- Items repetidos del mismo plato se suman.
- Cancelar: solo si el pedido está `PENDIENTE` y todos los subpedidos `PENDIENTE` (409 si ya fue cancelado, si no está pendiente o si algún subpedido ya avanzó). **Repone el stock** (y vuelve `AGOTADO`→`PUBLICADO` si corresponde).
- El estado del pedido se recalcula automáticamente a partir de sus subpedidos.
- Estados de pedido y subpedido: ver enums.

### 3.9 Subpedidos (`/subpedidos`) — CHEF / ADMIN (los clientes ven los subpedidos dentro de `OrderResponse`)

| Método y ruta                     | Descripción                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `GET /subpedidos/{id}`            | Solo el chef dueño o ADMIN (403 si no)                                        |
| `GET /subpedidos/order/{orderId}` | ADMIN: todos los del pedido. CHEF: solo los suyos. 404 si el pedido no existe |
| `GET /subpedidos/chef/{chefId}`   | Solo ese chef o ADMIN                                                         |
| `PATCH /subpedidos/{id}/estado`   | Avanza el estado                                                              |

Body `PATCH`: `{ "estado": "CONFIRMADO" }` (`@NotNull`, enum `EstadoPedido`). Respuesta: `SubPedidoChefResponse` (mismo objeto que dentro de `OrderResponse.subPedidos`).
Transiciones válidas (409 si no): `PENDIENTE→CONFIRMADO→EN_PREPARACION→ENVIADO→ENTREGADO`. Además 409 si la orden está cancelada, entregada, o **todavía `PENDIENTE`** (`"La orden debe estar confirmada antes de avanzar un subpedido"`: el pedido pasa a confirmado cuando se aprueba un pago, ver 3.10).
No existe `CANCELADO` como destino válido por este endpoint. `data:null` en listados vacíos.

### 3.10 Pagos (`/pagos`)

| Método y ruta                  | Acceso                                            |
| ------------------------------ | ------------------------------------------------- |
| `GET /pagos`                   | CLIENTE (solo los de sus pedidos) / ADMIN (todos) |
| `GET /pagos/{pagoId}`          | CLIENTE dueño / ADMIN                             |
| `POST /pagos/createPago`       | CLIENTE                                           |
| `PATCH /pagos/{pagoId}/estado` | **solo ADMIN**                                    |

Body `POST`: `{ "medioPago": "TARJETA_CREDITO", "pedidoId": 30 }` (ambos `@NotNull`). Body `PATCH`: `{ "estado": "APROBADO" }` (`@NotNull`).
Respuesta `PagoResponse`:

```json
{
  "id": 9,
  "pedidoId": 30,
  "monto": 9000.0,
  "medioPago": "TARJETA_CREDITO",
  "estado": "PENDIENTE",
  "fechaCreacion": "2026-10-19T14:31:00",
  "fechaPago": null
}
```

Reglas:

- `monto` = `precioFinal` del pedido (lo fija el servidor). El pago nace `PENDIENTE`.
- **No hay pasarela de pago ni confirmación por parte del cliente**: aprobar/rechazar lo hace un ADMIN con `PATCH`. Al aprobar, el pedido y sus subpedidos `PENDIENTE` pasan a `CONFIRMADO`. Mientras nadie apruebe, los chefs no pueden avanzar el pedido.
- Transiciones de pago: `PENDIENTE→APROBADO|RECHAZADO`, `APROBADO→REEMBOLSADO`; el resto 409.
- Errores: 409 `"No se puede registrar un pago para una orden cancelada"`; 409 `"La orden ya posee un pago aprobado"`; 400 `"Los intentos de pago para esta orden estan bloqueados"` (tras 5 pagos rechazados el pedido queda con `pagoBloqueado: true`); 403 si el pedido es de otro cliente; 404 pedido/pago inexistente.

### 3.11 Domicilios (`/domicilios`)

| Método y ruta                      | Acceso                                  |
| ---------------------------------- | --------------------------------------- |
| `GET /domicilios`                  | CLIENTE (los propios) / ADMIN (todos)   |
| `GET /domicilios/{id}`             | dueño / ADMIN                           |
| `GET /domicilios/usuario/{id}`     | solo ese usuario / ADMIN                |
| `POST /domicilios/createDomicilio` | CLIENTE (queda asociado al autenticado) |
| `PUT /domicilios/{id}`             | dueño / ADMIN                           |
| `DELETE /domicilios/{id}`          | dueño / ADMIN                           |

Body `POST` y `PUT` (mismos campos): `calle`, `numero`, `ciudad`, `provincia`, `codigoPostal` — todos `@NotBlank`; `piso`, `departamento`, `indicacionesEntrega` — opcionales.
Respuesta `DomicilioResponse`:

```json
{
  "id": 5,
  "calle": "Av. Siempreviva",
  "numero": "742",
  "piso": null,
  "departamento": null,
  "ciudad": "CABA",
  "provincia": "Buenos Aires",
  "codigoPostal": "1000",
  "indicacionesEntrega": "Timbre 2"
}
```

Regla: `PUT` y `DELETE` → 409 si el domicilio ya está asociado a un pedido (`"No se puede modificar/eliminar un domicilio asociado a un pedido"`). Para cambiar, crear uno nuevo. Nota: un ADMIN no puede crear domicilios (POST es solo CLIENTE).

### 3.12 Reseñas (`/resenas`)

| Método y ruta                  | Acceso                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `GET /resenas`                 | 🌐                                                              |
| `GET /resenas/{resenaId}`      | 🌐                                                              |
| `GET /resenas/plato/{platoId}` | 🌐 (404 si el plato no existe; ojo: existe aunque esté PAUSADO) |
| `POST /resenas/createResena`   | CLIENTE                                                         |
| `PUT /resenas/{resenaId}`      | autor / ADMIN                                                   |
| `DELETE /resenas/{resenaId}`   | autor / ADMIN                                                   |

Body `POST`: `{ "calificacion": 5, "comentario": "Excelente", "platoId": 12 }` — `calificacion` `@NotNull @Min(1) @Max(5)`, `platoId` `@NotNull`, `comentario` opcional.
Body `PUT`: `{ "calificacion": 4, "comentario": "..." }` (mismas validaciones de calificación; no se puede cambiar el plato).
Respuesta `ResenaResponse`:

```json
{
  "id": 1,
  "calificacion": 5,
  "comentario": "Excelente",
  "fechaCreacion": "2026-10-19T15:00:00",
  "clienteId": 7,
  "platoId": 12
}
```

Reglas: solo puede reseñar quien compró el plato en un **subpedido en estado `ENTREGADO`** (400 `"Solo puede resenar un plato comprado en un subpedido entregado"`); una reseña por cliente y plato (409). La respuesta no incluye el nombre del autor.

---

## 4. Modelos de datos

### Enums (valores exactos)

| Enum                                | Valores                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `Role`                              | `CLIENTE`, `CHEF`, `ADMIN`                                                       |
| `TipoRegistro` (registro público)   | `CLIENTE`, `CHEF`                                                                |
| `EstadoPlato`                       | `BORRADOR`, `PUBLICADO`, `AGOTADO`, `PAUSADO`                                    |
| `UnidadMedida`                      | `GRAMOS`, `KILOGRAMOS`, `MILILITROS`, `LITROS`, `UNIDAD`                         |
| `EstadoPedido` (pedido y subpedido) | `PENDIENTE`, `CONFIRMADO`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `CANCELADO` |
| `EstadoPago`                        | `PENDIENTE`, `APROBADO`, `RECHAZADO`, `REEMBOLSADO`                              |
| `MedioPago`                         | `TARJETA_CREDITO`, `TARJETA_DEBITO`, `TRANSFERENCIA`, `EFECTIVO`                 |

### DTOs de respuesta (resumen de tipos)

| DTO                                       | Campos                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthenticationResponse`                  | `access_token` string, `userId` long, `role` Role                                                                                                                                                                                                                                        |
| `UserResponse`                            | `id` long, `username`, `nombre`, `apellido`, `email` strings, `role` Role                                                                                                                                                                                                                |
| `PlatoResponse`                           | `id` long, `nombre` string, `descripcion` string, `imagenesUrls` string[], `precio` decimal, `descuentoPorcentaje` decimal, `precioConDescuento` decimal, `stockDisponible` int, `estado` EstadoPlato, `chefId` long, `categorias` string[], `ingredientes` `IngredientePlatoResponse[]` |
| `IngredientePlatoResponse`                | `ingredienteId` long, `nombre` string, `cantidad` decimal, `unidadMedida` UnidadMedida                                                                                                                                                                                                   |
| `Category` (entidad expuesta tal cual)    | `id` long, `description` string                                                                                                                                                                                                                                                          |
| `Ingrediente` (entidad expuesta tal cual) | `id` long, `nombre` string, `descripcion` string                                                                                                                                                                                                                                         |
| `ChefProfileResponse`                     | `id`, `userId` long; `biografia`, `especialidad`, `fotoUrl`, `descripcion` strings; `reputacion` decimal                                                                                                                                                                                 |
| `CarritoResponse`                         | `id` long, `items` `ItemCarritoResponse[]`, `totalEstimado` decimal                                                                                                                                                                                                                      |
| `ItemCarritoResponse`                     | `id`, `platoId` long; `nombrePlato` string; `cantidad` int; `precioBase`, `descuentoPorcentaje`, `precioUnitarioActual`, `subtotalEstimado` decimal                                                                                                                                      |
| `OrderResponse`                           | `id`, `userId`, `domicilioEntregaId` long; `fechaCreacion` datetime; `estado` EstadoPedido; `precioFinal` decimal; `pagoBloqueado` boolean; `subPedidos` `SubPedidoChefResponse[]`                                                                                                       |
| `SubPedidoChefResponse`                   | `id`, `chefId` long; `chefNombre` string; `estado` EstadoPedido; `subtotal` decimal; `detalles` `DetallePedidoResponse[]`                                                                                                                                                                |
| `DetallePedidoResponse`                   | `id`, `platoId` long; `platoNombre` string; `cantidad` int; `precioUnitario`, `subtotal` decimal                                                                                                                                                                                         |
| `PagoResponse`                            | `id`, `pedidoId` long; `monto` decimal; `medioPago` MedioPago; `estado` EstadoPago; `fechaCreacion`, `fechaPago` datetime (`fechaPago` null hasta aprobar)                                                                                                                               |
| `DomicilioResponse`                       | `id` long; `calle`, `numero`, `piso`, `departamento`, `ciudad`, `provincia`, `codigoPostal`, `indicacionesEntrega` strings                                                                                                                                                               |
| `ResenaResponse`                          | `id` long; `calificacion` int; `comentario` string; `fechaCreacion` datetime; `clienteId`, `platoId` long                                                                                                                                                                                |

Los DTOs de request están detallados en cada endpoint. El `password` nunca se devuelve.

---

## 5. Imágenes

- **Subida de archivos (nuevo, 24/10):** `POST /platos/{platoId}/imagenes` (multipart, campo `file`) guarda la imagen en disco y devuelve el plato con su URL absoluta; `GET /imagenes/{nombre}` la sirve. Ver sección 3.3. El host de las URLs sale de `PUBLIC_BASE_URL` (por defecto `http://localhost:4002`) y la carpeta de `IMAGENES_DIR` (por defecto `uploads/imagenes`); en un despliegue hay que configurarlas y usar un volumen persistente.
- Las imágenes de un plato siguen pudiendo ser **URLs de texto** (`imagenesUrls: string[]`, orden preservado), que el front manda en `POST/PUT /platos`. Se guardan en la tabla `plato_imagenes` (columna `imagen_url`). Las URLs de imágenes subidas por archivo se guardan en la misma lista.
- Foto de perfil del chef: igual, `fotoUrl` string en `ChefProfile`.
- Límites de tamaño/cantidad o validación de formato de URL: **NO EXISTEN** (solo `@NotBlank` por elemento). Longitud máxima de cada URL = default de columna (255 caracteres, NO CONFIRMADO; es el default de JPA para `String`).
- Un plato `PUBLICADO` exige al menos 1 URL.

---

## 6. Lo que falta / estado de los requisitos del TPO

| Requisito                              | Estado                         | Detalle                                                                                                                                                                                                                             |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registro de comprador / vendedor       | **Implementado**               | `POST /api/v1/auth/register` con `tipoCuenta` `CLIENTE` o `CHEF`                                                                                                                                                                    |
| Login con JWT                          | **Implementado**               | `POST /api/v1/auth/authenticate`                                                                                                                                                                                                    |
| Asignación de permisos/roles por admin | **Implementado (24/10)**       | `PATCH /users/{userId}/role` cambia el rol de un usuario existente (`PUT /users/{id}` sigue ignorando el rol). También `POST /users/createUser` crea usuarios con rol. No hay ADMIN inicial: hay que cargarlo a mano en la BD |
| Gestión de stock                       | **Parcial**                    | `stockDisponible` se setea en `POST/PUT /platos`; se descuenta al crear pedido/checkout y se repone al cancelar; el estado cambia solo `PUBLICADO`↔`AGOTADO`. No hay endpoint dedicado de ajuste de stock                           |
| Eliminación de productos               | **Implementado**               | `DELETE /platos/{id}`: borra, o pasa a `PAUSADO` si tiene historial/carrito                                                                                                                                                         |
| Descuentos por producto                | **Implementado**               | `PATCH/DELETE /platos/{id}/descuento` (porcentaje 0–99.99)                                                                                                                                                                          |
| Carrito                                | **Implementado**               | `/carrito/**`                                                                                                                                                                                                                       |
| Checkout con descuento de stock        | **Implementado**               | `POST /carrito/checkout` y `POST /orders/createOrder`                                                                                                                                                                               |
| Pedidos                                | **Implementado**               | `/orders/**`, `/subpedidos/**`; cancelación con reposición de stock                                                                                                                                                                 |
| Pagos                                  | **Implementado, sin pasarela** | El cliente crea el pago; solo ADMIN lo aprueba/rechaza                                                                                                                                                                              |
| Reseñas                                | **Implementado**               | `/resenas/**` (solo si el subpedido fue ENTREGADO)                                                                                                                                                                                  |
| Categorías / ingredientes              | **Implementado**               | CRUD solo ADMIN, lectura pública                                                                                                                                                                                                    |
| Domicilios                             | **Implementado**               | `/domicilios/**`                                                                                                                                                                                                                    |

### Faltantes y puntos de atención para el front

1. **CORS: NO EXISTE** → bloqueo desde `localhost:5173` (ver sección 1).
2. **Swagger/OpenAPI: NO EXISTE.**
3. **Subida de imágenes: EXISTE desde el 24/10** (`POST /platos/{platoId}/imagenes`, ver 3.3); las URLs de texto siguen funcionando.
4. **Paginación, ordenamiento y búsqueda avanzada: NO EXISTEN** (solo filtros `nombre`, `categoriaId`, `precioMin`, `precioMax` en `GET /platos`).
5. **"Mis platos" del chef: EXISTE desde el 24/10** (`GET /platos/mis-platos`, todos los estados), y `GET /platos/{id}` devuelve al dueño (o a un ADMIN) sus `BORRADOR`/`PAUSADO`. `GET /platos` sigue mostrando solo `PUBLICADO`/`AGOTADO`.
6. **Aprobación de pago solo por ADMIN**: no hay forma de que el flujo cliente→pago→confirmación se complete sin intervención de un admin.
7. **No hay endpoint "mi perfil de chef"** ni "mis subpedidos" sin conocer el `chefId` (usar `GET /subpedidos/chef/{userId propio}`).
8. **`data: null` en listas vacías** (no `[]`).
9. **Respuestas de error 500 genéricas** para rutas/métodos inexistentes y path params inválidos (probable, NO CONFIRMADO).
10. **Usuario duplicado devuelve 400**, no 409.
11. El **rol no viene en el JWT**: guardar `role` y `userId` de la respuesta de login para decidir qué mostrar en la UI.
12. Cancelar un pedido no modifica los pagos asociados (no hay reembolso automático).

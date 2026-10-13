# Guía para pasar a React (Vite + Tailwind 3)

Los HTML de esta carpeta son la **referencia visual y de estructura**. Usan el CDN de Tailwind y JS plano solo para poder abrirlos con doble clic; en React cada bloque pasa a ser un componente.

## 1. Instalar los tokens

1. Reemplazá `tailwind.config.js` del proyecto por el de esta carpeta (mismo formato ESM).
2. Copiá `assets/appetitos.css` a `src/index.css`, **debajo** de las tres directivas `@tailwind`. Las reglas de componentes (`.btn`, `.chip`, `.field`, …) van dentro de `@layer components { … }`. Dejá fuera de la capa: `:root`, `html`, `body`, `@keyframes` y `@media (prefers-reduced-motion)`.
3. `index.html` conserva los `<link>` de Google Fonts (Fraunces, Newsreader, Sora) y de Material Symbols Outlined.

## 2. Componentes sugeridos

| Componente | Archivo de referencia | Props / estado |
|---|---|---|
| `Logo` | `.logo` en cualquier página | `size`, `onDark` |
| `Header` | todas | `active`, `cartCount`, `ordersCount`; estado `menuOpen` |
| `Footer` | todas | — |
| `DishCard` | `catalogo.html`, `componentes.html` | `dish` (ver abajo), `hideChef`, `onAdd` |
| `StockBadge` | dentro de `DishCard` | `state`, `left` |
| `PriceTag` | `DishCard`, detalle, cesta | `price`, `oldPrice?` |
| `QuantityStepper` | detalle, cesta | `value`, `min`, `max`, `onChange` |
| `FilterSidebar` | `catalogo.html` | `filters`, `onChange`; espeja la URL con `useSearchParams` |
| `PriceRange` | `catalogo.html` | `min`, `max`, `onChange` |
| `AppliedFilters` | `catalogo.html` | `filters`, `onRemove` |
| `Gallery` | `detalle.html` | `images`, estado `active` |
| `PortionPicker` | `detalle.html` | `options`, `value`, `onChange` |
| `IngredientTrace` | `detalle.html` | `items[]` |
| `ReviewList` + `RatingSummary` | `detalle.html` | `reviews[]`, `summary` |
| `CartGroup` / `CartLine` | `cesta.html` | agrupado por vendedor |
| `OrderSummary` | `cesta.html` | `subtotal`, `shipping`, `onConfirm` |
| `Toast`, `Alert`, `EmptyState` | `componentes.html` | `message`, `variant` |

### Forma del objeto plato (alineada con el backend)

```js
{
  id, title, description, images: [url],
  category, price, discountPercent,       // el precio tachado se calcula
  stock,                                   // 0 → state "soldout"; ≤ 5 → "low"; si no "available"
  seller: { id, name, avatarUrl, verified },
  rating, reviewsCount, prepMinutes, tag
}
```

El estado de la tarjeta sale del stock, no se guarda aparte:

```js
const state = stock === 0 ? 'soldout' : stock <= 5 ? 'low' : 'available';
```

## 3. Reglas del TPO que ya están resueltas en el diseño

- **Sin stock no se agrega**: la tarjeta con `state="soldout"` muestra “Agotado hoy”, la foto en grises y el botón deshabilitado (`aria-disabled`).
- **Stock disponible**: “Quedan N hoy” aparece con texto y punto de color. El selector de cantidad se bloquea en `max = stock`.
- **Conflicto de stock al confirmar**: usá el aviso `role="alert"` de `componentes.html` (“Se agotó una porción…”) cuando el backend devuelva 409.
- **Descuentos**: precio nuevo grande, precio anterior tachado y badge “−15%”.
- **Filtros por categoría y precio**: `FilterSidebar` + `PriceRange` + chips aplicados.
- **Vendedor vs comprador**: la cesta ya agrupa por vendedor, lo que facilita mostrar el total por chef.

## 4. Pantallas que no estaban en Stitch (ya armadas)

| Pantalla | Archivo | Requisito del TPO | Componentes sugeridos |
|---|---|---|---|
| Ingreso | `ingreso.html` | Login | `AuthShell`, `FormField`, `PasswordField` |
| Registro | `registro.html` | Usuario, correo, contraseña, nombre, apellido, rol comprador/vendedor | `AuthShell`, `FormField`, `RoleOption` |
| Mis publicaciones | `publicaciones.html` | Vendedor: stock, descuento por plato, eliminar | `PublicationRow`, `QuantityStepper`, `Dialog`, `FilterChips` |
| Publicar / editar plato | `publicar.html` (`?editar=1` = modo edición) | ≥1 foto, descripción, categoría, precio, stock, descuento | `PhotoUploader`, `FormField`, `LivePreview` (reusa `DishCard`) |
| Mis pedidos | `pedidos.html` | Seguimiento del pedido confirmado | `Tabs`, `OrderCard`, `OrderTrack`, `Dialog` |

Además, `Header` ahora incluye `AccountMenu` (desplegable con “Mis pedidos”, “Mis publicaciones”, “Salir”). En React mostrá “Mis publicaciones” solo si `user.role === 'VENDEDOR'`.

**Disparadores de demo** (para ver los estados sin backend; en React salen de la respuesta de la API):

- Contraseña `error1234` en el ingreso → aviso de credenciales incorrectas (401).
- Usuario `clara.mendez` en el registro → “Ese usuario ya está en uso” (409).
- `registro.html?rol=vendedor` → preselecciona el rol; al registrarse lleva a `publicaciones.html`.
- `publicar.html?editar=1` → carga un plato existente (título, fotos, precio).
- `pedidos.html?nuevo=1` → aviso de pedido recién confirmado (a donde va el botón “Confirmar pedido” de la cesta).

**Reglas de validación ya resueltas** (`data-validate`): cada campo muestra su error debajo con `role`/`aria-describedby`, el foco va al primer campo inválido y el mensaje dice la causa y cómo arreglarla. En React: `aria-invalid` + `FormField` con prop `error`.

**Estado del stock en la vista del vendedor:** se deriva igual que en la tarjeta (`0 → Sin stock`, `≤5 → Quedan N`, si no `Publicado`), y al llegar a 0 el plato deja de poder agregarse a la cesta.

**No incluido:** pantalla de administración de usuarios / asignación de permisos (el TPO la menciona). Si la necesitás, sale con los mismos componentes (tabla de usuarios + selector de rol).

## 5. Notas de integración

- Las imágenes son las URL originales de Stitch; reemplazalas por las del backend.
- `app.js` no se copia: sus bloques están comentados con el hook de React que lo reemplaza (`useState`, `useReducer`, `useSearchParams`).
- Ícono y foco: todos los botones de solo ícono llevan `aria-label`; mantenelo al migrar.
- El proyecto `appetitos-react` que ya tenías no se modificó.

# Appetitos · Sistema de diseño v2

Mismo carácter que el v1 de Stitch (cocina de taller, crema, oliva, tipografía editorial). La **paleta no cambia**. Lo que cambia es cómo se usa: jerarquía, legibilidad, estados y consistencia.

## Qué se corrigió respecto de Stitch

| Antes | Ahora | Por qué |
|---|---|---|
| Dos logos superpuestos en la barra (imagen + texto) | Un solo logo, texto real con “o” en SVG | Se pisaba con el menú y el “o” quedaba despegado (“Appetit o s”) |
| Enlaces del menú y “En taller / 2 activos” partidos en 2 y 3 líneas | Una línea, ícono + contador, “Mis pedidos” | Texto legible y sin saltos |
| Textos de 10 px en mayúsculas con espaciado | Mínimo 12 px, en minúsculas | Legibilidad y accesibilidad (WCAG) |
| Una etiqueta en mayúsculas sobre cada título | Se quitaron salvo donde informan | La estructura debe aportar información, no decorar |
| Una palabra en cursiva y subrayada dentro de los titulares | Titulares limpios, la cursiva solo en firmas de chef | Evita el efecto plantilla |
| Numeración 01/02/03 en el manifiesto | Lista con íconos | No es una secuencia |
| Tarjetas con sombra, zoom y botón distinto en cada una | Tarjeta sin caja, un solo botón de agregar | Menos ruido; el plato es lo importante |
| Sin estado de stock ni descuento | `available / low / soldout` + precio tachado | Requisito del TPO |
| Radios de borde distintos entre `DESIGN.md` y Tailwind | Una escala única | Ver “Formas” |
| Botones en `#18240B` y marca en `#2D3A1F` | Botón en oliva `#2D3A1F`, hover en `#18240B` | Coincide con el `DESIGN.md` original |
| Paso 1/2/3 en la cesta con nombres poco claros | Se quitó: es una sola página | El stepper no era una secuencia real |

## Color (sin cambios + 3 agregados)

Se mantienen todos los tokens de color de Stitch. Agregados: `accent #C46A4A` (terracota, solo puntos y rellenos), `accent-soft #F5E8DC` (fondo de avisos) y `hairline rgba(45,58,31,.12)` (líneas finas).

| Rol | Token | Hex |
|---|---|---|
| Acción principal, marca | `primary-container` | `#2D3A1F` |
| Títulos, hover de botón | `primary` | `#18240B` |
| Fondo de página | `surface` | `#FCF9F0` |
| Bandas de apoyo | `surface-container-low` | `#F6F3EA` |
| Tarjetas, campos | `surface-container-lowest` | `#FFFFFF` |
| Descuento, CTA sobre oliva | `secondary-container` | `#F6DEA2` |
| Estrellas, distancias | `secondary` | `#6E5D2D` |
| Verificado, disponible | `primary-fixed` | `#D8E8C1` |
| Poco stock (texto) | `on-tertiary-fixed-variant` | `#793015` |
| Error | `error` | `#BA1A1A` |

Regla: la terracota `#C46A4A` sobre crema da 3.6:1, así que **no se usa para texto chico**. El texto de “Quedan pocas” va en `#793015` (contraste mayor a 7:1).

## Tipografía

Newsreader para lo que se lee y se firma; Sora para lo que se toca. Fraunces 700 solo en el logo.

| Token | Tamaño / interlínea | Uso |
|---|---|---|
| `display-lg` | 60/64 (móvil 40/44) | Titular del hero |
| `headline-lg` | 40/46 (móvil 30/36) | Título de sección |
| `headline-md` | 28/34 | Subtítulo de bloque |
| `headline-sm` | 22/28 | Nombre de chef, de grupo |
| `title-md` | 20/26 | Nombre de plato |
| `price-lg` / `price-md` | 36/40 · 22/28 | Precios (cifras tabulares) |
| `body-lg / md / sm` | 18/28 · 15/24 · 13/20 | Texto |
| `label-lg / md / sm` | 14 · 13 · 12 | Botones, etiquetas, badges |

- Nada por debajo de 12 px. Cursiva de Newsreader solo para citas de chef y recomendaciones.
- Largo de línea máximo: 65 a 75 caracteres (`max-w-*`).
- Precios con `tabular-nums` para que alineen en columnas.

## Formas

| Elemento | Radio |
|---|---|
| Botones, campos | `rounded-md` 0.75 rem |
| Fotos de plato, tarjetas internas | `rounded-lg` 1 rem |
| Resumen, grupos de la cesta, hero | `rounded-xl` 1.5 rem |
| Chips, badges, botones de ícono | `rounded-full` |
| Foto principal del hero | Arco: `rounded-t-full rounded-b-xl` |

El arco es el único gesto formal fuerte (referencia a la boca de un horno). Se usa una sola vez, en el hero de la home.

## Elevación

Sin sombras duras. `shadow-ambient` para tarjetas blancas sobre crema y `shadow-lift` solo para lo que flota (ticket del hero). La estructura se marca con `border-hairline`.

## Movimiento

Un solo momento de entrada: el hero de la home (`.rise`, `.settle`). El resto responde a acciones del usuario: botón (hundido 1 px), aviso al agregar, cantidad. Todo respeta `prefers-reduced-motion`.

## Accesibilidad (piso de calidad)

- Foco visible en todo (`:focus-visible`, anillo oliva; arena sobre fondos oscuros).
- Objetivos táctiles de al menos 44 px.
- Enlace “Ir al contenido” al inicio de cada página.
- Estados de stock con texto además de color (“Quedan 4 hoy”, “Agotado hoy”).
- Errores con `role="alert"` y la solución dentro del mensaje.

## Texto de la interfaz

- Voseo rioplatense, oraciones en minúsculas (“Elegí la porción”, “Confirmar pedido”).
- El botón dice qué pasa. Mismo verbo en botón y aviso: “Agregar” → “Agregaste”.
- Errores sin disculpas, con la causa y qué hacer.
- Nombres corregidos: **Kenji Takahashi** (en la cesta figuraba “Tanaka”), derechos “© 2026”, sin “S.L.”.

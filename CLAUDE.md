# Appetitos — frontend (TPO-API-FRONT)

## Contexto

E-commerce gastronómico. React + Vite, solo JavaScript, Tailwind 3.
El backend (Spring Boot) está en otro repo.
Diseño de referencia: carpeta `appetitos_ui_mejorada` (HTML, tailwind.config.js,
appetitos.css, GUIA-REACT.md).

## Cómo trabajar conmigo (IMPORTANTE)

- Soy estudiante y aprendo haciendo. Avanzá de a UN paso chico por vez y
  frená para que lo revise antes de seguir.
- Antes de escribir código, decime en 2-3 líneas qué vas a hacer y por qué.
- Después de escribirlo, explicá qué hace cada parte, línea por línea si el
  concepto es nuevo (qué es una prop, un hook, un import, etc.).
- Cuando aparezca un concepto nuevo, definilo en una frase y relacionalo con
  lo que ya vimos.
- No toques archivos fuera del paso pedido. No instales dependencias sin avisar
  y explicar para qué.
- Respondé en español rioplatense.

## Reglas de la profesora (no negociables)

- Solo JavaScript, archivos .jsx. Nada de TypeScript.
- `src/` solo con `views/` y `components/`; `App.jsx` y `main.jsx` afuera.
- NO tocar `index.html` ni `main.jsx`. El router va dentro de `App.jsx`.
- Prohibido manipular el DOM: nada de `document.*` ni `window.*`
  (ni `window.alert`). Los modales se hacen con estado.
- Componente = función con mayúscula, mismo nombre que el archivo, retorna
  JSX con un único padre (o fragment) y termina con `export default`.
- Todo `const` salvo que haga falta cambiarlo. Siempre `===`.
- Listas con `map` y `key`. El filtrado real lo hace el backend.
- Una sola librería de estilos (Tailwind). No agregar Bootstrap ni MUI.
- Nunca subir ni entregar `node_modules`.

## Hoja de ruta (marcá lo hecho)

- [x] 1. Proyecto Vite creado
- [x] 2. Estructura views/components y primer componente
- [x] 3. Tailwind 3 + tokens de Appetitos
- [x] 4. Logo y Button (props)
- [x] 5. DishCard (map)
- [x] 6. Header, Footer y rutas
- [x] 7. Home y Catálogo con datos de ejemplo (map y key)

## Referencia de diseño

Los HTML de `referencia-visual/` son solo referencia visual y de estructura:
NO son parte de la app y NO se importan. Para armar una vista, leé el HTML
correspondiente (por ejemplo `detalle.html`) y convertilo a componentes JSX.
Ignorar `referencia-visual/assets/app.js` (usa DOM, está prohibido en React).

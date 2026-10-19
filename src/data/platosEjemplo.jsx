// DATOS TEMPORALES de ejemplo (paso 11b). Se borra al conectar el backend (paso 12).
// Cada plato tiene la MISMA forma que PlatoResponse de la API (ver ENDPOINTS.md, sección 3.3),
// así en el paso 12 solo cambia de dónde vienen los datos.
//  - precio: precio base. precioConDescuento: el que se cobra (precio x (100 - descuento) / 100).
//  - estado: "PUBLICADO" o "AGOTADO" (el backend pone AGOTADO cuando el stock es 0).
//  - categorias: textos (descripciones), no ids; coinciden con categoriasEjemplo.
//  - Plato 4 tiene descuento (15 %) y plato 7 está AGOTADO (stock 0).
const PLATOS_EJEMPLO = [
  {
    id: 1,
    nombre: 'Ravioli de hongos silvestres y noisette',
    descripcion: 'Pasta de sémola rellena de ricotta de granja, setas de temporada y salvia crujiente.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANhvv19i3bO8CZOGjtiv3eGepjcPg20Cxpm7L-atqFfTNCG76iLDbt8QwIEjAQv9EnTFr3FB65DzsJbm18gpLKJumkzw1Q0vw-gY7YtCDrV9_c79Fi339vRxkoEPksZlx9nURqHS14P1r20LceaBdYx8VBLO2-1ieJ9xH6NNPOUpQGUsZwm5LnyBOLAJKE7QzxP4VBS8cVmRw1kzaTHo5ftnWBSkOdm5ysZesa8HjUQhnhBWWMQC36',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUkCuw4QzCperkB29Zq9Vi5_HRf6tXvi1gT9o-fz4medk95dHCdOBffBpza-l7IyhvoIha__yY13TUmEinHTCB89Y5wMD8RNvSYUGMJeRmOmiwRZ8wedv1ueR2Zg4_H10KwE4r0Tzyh_4LiQN8_dFmMcy4JxtQzwjVpryiFX2RXcM1IhOrzd_kNsZdRMiNjt32YldmRh0-yoAKofg4X3fsyDXDyKBf7nf1a-6lJ9zoI7-suuC5d01Y',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAKV0u6sqS2NStkjOjn4n6MDm0QIXEMyb_zMByzKRa3VzC9p_CPaop8JbcnhFKB_yTkS7vDVnN8q_2-ayPsdspSzRr99OZZ6ClK1XIAbBel1LHT9siTW6bKlLqKBZje-zAwHN9sxbz_dWgq_S9Qhcqg-E0M-xfNDjmkyWP89r3QhhjWH188vzrziPF204s3BgH1uD3hkLqZSHCOR2aNfU_unXSbm9XB2Wew4O3ubuIVyU5M-gxQYpz',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYR0N8UuugNGc5Db1gjgU75MDOmsEyo9JMoOftK6c1NeacJu4T6Z0EkYjtG5UT4LeXNkVxedgr5uFehy5vsARgBAC5XNenh7hrC3aqroi6PNTIltH6BNV64xo30NzMC43wSqh5acrc5sg-FC4R0a0hmEpIXLa-jaPvduBEnnnIG_SApqSvrwYl9hUPWw6GQKJuwOhj3QsJYFJweeOTPn545fVpiGjrBKMfR9rjPKrisii84dcchoOe',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4n62yANwj1J9qvrYikO12D1MY5qtnEmlCOOpey-s9F-SVyYFSiRYV593MrB-rd9iqeWBaCtVExDAjR85c0MhyePvpwikY06jwjo-2IFhCTDZouz8W6Jy7qJW7g7i4eTCeUGOm39nqzEZutlEHfqsDKtBoKvDPsNsGLp35oKexgCYKgvcAsxumoDqQ6iWV6CkdhBZjeCrgPHJ6TNzuDWjoDV7Z_rXQQ15MgP7oHHejt0dfDGjX4WHb',
    ],
    precio: 18400,
    descuentoPorcentaje: 0,
    precioConDescuento: 18400,
    stockDisponible: 4,
    estado: 'PUBLICADO',
    chefId: 1,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Matteo Rossi',
    categorias: ['Pastas'],
    ingredientes: [
      {
        ingredienteId: 1,
        nombre: 'Harina orgánica de molino de piedra',
        cantidad: 250,
        unidadMedida: 'GRAMOS',
      },
      {
        ingredienteId: 2,
        nombre: 'Ricotta fresca de oveja',
        cantidad: 250,
        unidadMedida: 'GRAMOS',
      },
      {
        ingredienteId: 3,
        nombre: 'Hongos silvestres recolectados',
        cantidad: 250,
        unidadMedida: 'GRAMOS',
      },
      {
        ingredienteId: 4,
        nombre: 'Manteca de pastoreo y salvia',
        cantidad: 250,
        unidadMedida: 'GRAMOS',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Berenjena nasu dengaku con miso rojo',
    descripcion: 'Asada sobre carbón de encina y laqueada con miso fermentado en barrica.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBh_tpZ6QaWQI4Iv941lDTLgMPHEd3hlPaE82nwMvte4YiRoc2Xjn-BtlLZSlbiKQ82BegvIK8kfBLy75GN4hSLzWxpFNH41Wx7vxwv1XR_PIJXK8v_RN2gXrGICGP71VTFu1yF658nd3WyzQCvrUm070tQjbazpsGH_ax0a8FwLaGlEXRqWsk-4iuFiWnSotaMPrx4uChJFDKl8i-ixPqL5yw7D1IqvE-tiZZ5Fy96WtBmXzFtoM1A',
    ],
    precio: 14200,
    descuentoPorcentaje: 0,
    precioConDescuento: 14200,
    stockDisponible: 12,
    estado: 'PUBLICADO',
    chefId: 2,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Kenji Takahashi',
    categorias: ['Vegetariano'],
    ingredientes: [],
  },
  {
    id: 3,
    nombre: 'Agnolotti del plin al jugo de asado',
    descripcion: 'Pellizcos de pasta piamontesa rellenos de estofado de tres carnes.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUe9w0m2CasN_e-nExjRX86Wi_0O_4R4PisJ6Axfr4Rg6QzxpUhAkRQZfnKQJ0aks4fpSXQDQw65tOOlqjeIpM-PeO9K6tyZA0bPybI2dlsoywdYHyHGY65UHQMeondHN9wD_U1pU_Z-UktEkWZIui9DKl5VTN5dv4AuQRFveYz5m9SEgNmkvUTHXCWxRluOqpl0n6NEt9wKWuN9re6Vwqwp3o066K_6DgziFl0JE-8S-CI57wMewc',
    ],
    precio: 19800,
    descuentoPorcentaje: 0,
    precioConDescuento: 19800,
    stockDisponible: 8,
    estado: 'PUBLICADO',
    chefId: 3,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Clara Méndez',
    categorias: ['Pastas'],
    ingredientes: [],
  },
  {
    id: 4,
    nombre: 'Focaccia centenaria con higos y romero',
    descripcion: 'Trigo molido a la piedra, higos caramelizados al horno de leña y flor de sal.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBT416oGPUaVAYYWSdD7HlusSdvg6HrfvuOkiGN4Qh6eSpEDFPSJEGA00owHnkChGynzEBARDQklRkkWRWwmwiL4UujSSv-wiOxb2wQsLcXBeLuqeBRShx_PH1HhPBm7oERWB18z_pE1NdXGf0w_m5MIxaY-w2-Udj-friBZL-37G4n0mmhqBngTsXl83Pu88VYVr8MB2wi7mOigHs4voIfuyeasgHs8haBLLmoPKrKT2NF2FQV2URk',
    ],
    precio: 9600,
    descuentoPorcentaje: 15,
    precioConDescuento: 8160,
    stockDisponible: 15,
    estado: 'PUBLICADO',
    chefId: 4,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Elena y Tomás',
    categorias: ['Panadería'],
    ingredientes: [],
  },
  {
    id: 5,
    nombre: 'Curry verde de tubérculos y coco',
    descripcion: 'Hierbas machacadas en mortero, leche de coco recién exprimida y calabazas asadas.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpAyO37tsQDMAOgzhJIiaPhJmq1RSdGzy2Xgv9Pb7rDbrUrSKHL25PhqOyhzPc4klrKpBv5XT2vNWdnjTI-AWVKT9Wmmo42YJ8BA2XN4pDKJokn1r4QetCdW2kS2q46S66a5v9qrEcgmmSa5hvsJ_-mth6FORWGhOldfYfOWCHNOGdNsey9ReNFRXX0GG5McpeJDKvh-mBngTMUwp4TlTmH-5Kb-3r0mqfu7CusWm5eVJn4VAxlobD',
    ],
    precio: 15500,
    descuentoPorcentaje: 0,
    precioConDescuento: 15500,
    stockDisponible: 9,
    estado: 'PUBLICADO',
    chefId: 3,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Clara Méndez',
    categorias: ['Vegano'],
    ingredientes: [],
  },
  {
    id: 6,
    nombre: 'Panceta glaseada con manzana ahumada',
    descripcion: 'Cocida al vacío y terminada sobre carbón, con salsa de sidra y mostaza fermentada.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCEKze5DpWrYW5JPGx9CCuojYuantsd5bK9USwbTg8_CVz3LVuW4c_Ymde6Bd9v9oq7g8Tcfom-vhrlgbjhksH3p96gxp4enxSDlAuckewr3gCvLfva2wTFgUBhG0hTDpD05he6ZW-cN5ElTC8r9_aJJc6ZyAdkKRNI1hcN85Z00sTshPw3kUEYj1k6oeVaRQrvOFiZ3DKwlEKRlZmjW9t3DQizhvMNsdVGRpmsF6afeXjwcx-q-hoX',
    ],
    precio: 22000,
    descuentoPorcentaje: 0,
    precioConDescuento: 22000,
    stockDisponible: 3,
    estado: 'PUBLICADO',
    chefId: 2,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Kenji Takahashi',
    categorias: ['Carnes'],
    ingredientes: [],
  },
  {
    id: 7,
    nombre: 'Tagliatelle al ragú de manzo al vino tinto',
    descripcion: 'Receta de Bolonia de tres generaciones, reducida con Malbec orgánico.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdEeu9Vzi21twtphOH7YN5tnAEyDwztJcrvDnfWX6KH-VC4sBwRZMKjr9HDP-ikd3ZaFjLb-GdugyJYGU78DTvhUZS-0wnoq4P9-QKRtf72itK0zShwngxL7TMw6Y8lqeckOxmRQFdOd9U1raltZILKCokqWPpN8VNuU0UjL3DlJeGFVWCzXR8aUB677ApLc16FXIgf_UPOuXX_UJuq1RrWaE7DRxKhXh_oUHQV5IHCGvGz_gFiCgf',
    ],
    precio: 15500,
    descuentoPorcentaje: 0,
    precioConDescuento: 15500,
    stockDisponible: 0,
    estado: 'AGOTADO',
    chefId: 1,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Matteo Rossi',
    categorias: ['Pastas'],
    ingredientes: [],
  },
  {
    id: 8,
    nombre: 'Tarta tatin con manzanas asadas y cardamomo',
    descripcion: 'Manzanas criollas de Río Negro confitadas en caramelo rubio con hojaldre de manteca.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDeSf0yqtcU6zOHQAG0p_ep86QGBRHTcMJFbutSvajweKoYwak61jeXq_Jg-qPUdYYOO9-gUfoXWwVTWyeD_gdvIniletNe7HHHXuntr6GCIUFT9zZAtjy9WZ8IZeGZUyn3eqhhQd7nw4cf15HxPpDjW-7uScQdy8pvgMUu47dYvGKlxEaRC8iqfczQOgTpCsoyV4t7PCO147hurEIEIC-klrWaTrRyufuiJR0pWpAiJghcfcFGa_47',
    ],
    precio: 11800,
    descuentoPorcentaje: 0,
    precioConDescuento: 11800,
    stockDisponible: 10,
    estado: 'PUBLICADO',
    chefId: 5,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Elena Rostand',
    categorias: ['Postres'],
    ingredientes: [],
  },
  {
    id: 9,
    nombre: 'Costillar ahumado con leña de manzano',
    descripcion: 'Nueve horas de ahumado en pozo, con puré rústico y hojas amargas.',
    imagenesUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGoG6hzzD2TYU-vW87aDQfBM3KkXRxroACBeH4Owwziy9PQ4cC9A5a-ilh6qx_e01wXKCX8UvEzxtH6DxK_k9Zzg1Sv-6HGPLhI1cmQsJdsZaOPAU0p70QdYCnpUH6EdG1pfm-_jVM3QjyNvywIkqK6y0fduE_3vtvK4UX5H8unZ1MlVFFYGxEFxs4_19W55o1vf3q2fKg9UuFsRYL87Ye97mwuWjR5sw9tgbXKZs9dBWWd2_DYBRV',
    ],
    precio: 18900,
    descuentoPorcentaje: 0,
    precioConDescuento: 18900,
    stockDisponible: 7,
    estado: 'PUBLICADO',
    chefId: 6,
    // TODO: la API todavía no trae el nombre del chef (solo chefId). Se quita en el paso 12.
    chefNombre: 'Camila Valenzuela',
    categorias: ['Carnes'],
    ingredientes: [],
  },
]

export default PLATOS_EJEMPLO

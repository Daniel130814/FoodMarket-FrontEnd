// DATOS TEMPORALES de ejemplo (paso 7). Se borra al conectar el backend.
const PLATOS_EJEMPLO = [
  {
    id: 1,
    title: 'Ravioli de hongos silvestres y noisette',
    description: 'Pasta de sémola rellena de ricotta de granja, setas de temporada y salvia crujiente.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANhvv19i3bO8CZOGjtiv3eGepjcPg20Cxpm7L-atqFfTNCG76iLDbt8QwIEjAQv9EnTFr3FB65DzsJbm18gpLKJumkzw1Q0vw-gY7YtCDrV9_c79Fi339vRxkoEPksZlx9nURqHS14P1r20LceaBdYx8VBLO2-1ieJ9xH6NNPOUpQGUsZwm5LnyBOLAJKE7QzxP4VBS8cVmRw1kzaTHo5ftnWBSkOdm5ysZesa8HjUQhnhBWWMQC36',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUkCuw4QzCperkB29Zq9Vi5_HRf6tXvi1gT9o-fz4medk95dHCdOBffBpza-l7IyhvoIha__yY13TUmEinHTCB89Y5wMD8RNvSYUGMJeRmOmiwRZ8wedv1ueR2Zg4_H10KwE4r0Tzyh_4LiQN8_dFmMcy4JxtQzwjVpryiFX2RXcM1IhOrzd_kNsZdRMiNjt32YldmRh0-yoAKofg4X3fsyDXDyKBf7nf1a-6lJ9zoI7-suuC5d01Y',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAKV0u6sqS2NStkjOjn4n6MDm0QIXEMyb_zMByzKRa3VzC9p_CPaop8JbcnhFKB_yTkS7vDVnN8q_2-ayPsdspSzRr99OZZ6ClK1XIAbBel1LHT9siTW6bKlLqKBZje-zAwHN9sxbz_dWgq_S9Qhcqg-E0M-xfNDjmkyWP89r3QhhjWH188vzrziPF204s3BgH1uD3hkLqZSHCOR2aNfU_unXSbm9XB2Wew4O3ubuIVyU5M-gxQYpz',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYR0N8UuugNGc5Db1gjgU75MDOmsEyo9JMoOftK6c1NeacJu4T6Z0EkYjtG5UT4LeXNkVxedgr5uFehy5vsARgBAC5XNenh7hrC3aqroi6PNTIltH6BNV64xo30NzMC43wSqh5acrc5sg-FC4R0a0hmEpIXLa-jaPvduBEnnnIG_SApqSvrwYl9hUPWw6GQKJuwOhj3QsJYFJweeOTPn545fVpiGjrBKMfR9rjPKrisii84dcchoOe',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4n62yANwj1J9qvrYikO12D1MY5qtnEmlCOOpey-s9F-SVyYFSiRYV593MrB-rd9iqeWBaCtVExDAjR85c0MhyePvpwikY06jwjo-2IFhCTDZouz8W6Jy7qJW7g7i4eTCeUGOm39nqzEZutlEHfqsDKtBoKvDPsNsGLp35oKexgCYKgvcAsxumoDqQ6iWV6CkdhBZjeCrgPHJ6TNzuDWjoDV7Z_rXQQ15MgP7oHHejt0dfDGjX4WHb'
    ],
    category: 'Pastas',
    price: 18400,
    discountPercent: 0,
    stock: 4,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 18400 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 35000 },
    ],
    ingredients: [
      {
        id: 1,
        icon: 'grain',
        name: 'Harina orgánica de molino de piedra',
        origin: 'Molino Harinero Mayaco, Tres Arroyos. Trigo candeal molido despacio para conservar el germen.',
        distance: '420 km',
      },
      {
        id: 2,
        icon: 'egg',
        name: 'Ricotta fresca de oveja',
        origin: 'Cabaña San Isidro, Sierras de Tandil. Cuajada natural de leche cruda, 24 horas antes del amasado.',
        distance: '340 km',
      },
      {
        id: 3,
        icon: 'forest',
        name: 'Hongos silvestres recolectados',
        origin: 'Gírgolas y boletus de pinar, recolectados a mano en bosques serranos.',
        distance: 'Cosecha de la mañana',
      },
      {
        id: 4,
        icon: 'spa',
        name: 'Manteca de pastoreo y salvia',
        origin: 'Manteca de vacas en pastoreo libre y salvia del huerto orgánico del taller.',
        distance: 'Huerto propio',
      },
    ],
    reviews: [
      {
        id: 1,
        author: 'Martina Rossi',
        verified: true,
        when: 'hace 2 días',
        rating: 5,
        comment: 'La textura de la masa es increíble: sedosa pero firme. La manteca noisette con la salvia le da una profundidad que no encontrás ni en trattorias caras.',
      },
      {
        id: 2,
        author: 'Santiago Beltrán',
        verified: true,
        when: 'hace 5 días',
        rating: 5,
        comment: 'Llegó impecable, tibio y con las indicaciones exactas para la sartén. En 2 minutos teníamos una cena de aniversario. Los hongos se sentían frescos.',
      },
      {
        id: 3,
        author: 'Valeria Gómez',
        verified: true,
        when: 'hace 1 semana',
        rating: 5,
        comment: 'La ricotta de Tandil marca la diferencia: es cremosa y dulce, nada industrial. Clara es una artista de la pasta.',
      },
    ],
    seller: {
      id: 1,
      name: 'Matteo Rossi',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu6f35qJvtgazdwbgtk6jDLqmfeDeP0H71PJEU3_8JZMheDYPLk36qkouZgXq1BegBZvXqe5VClD10LFTB4GScc9NPFfuoMm_C2z3AxYie4Mpoft9Nx-RddgYUWc4GL5OOYpw1_Mc0gttDIpH_8emWjlkj_CuxIXTaS4fS34XaJMnWmCiiJ8HzGYdpZrW4AAvoq2_dtuAJKFnqz9XF_vVCWDx551xmnnVAb6YVMZQDieviXDBvfMAc'
    },
    rating: 4.98,
    reviewsCount: 62,
    prepMinutes: 45,
    tag: 'Km 0'
  },
  {
    id: 2,
    title: 'Berenjena nasu dengaku con miso rojo',
    description: 'Asada sobre carbón de encina y laqueada con miso fermentado en barrica.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBh_tpZ6QaWQI4Iv941lDTLgMPHEd3hlPaE82nwMvte4YiRoc2Xjn-BtlLZSlbiKQ82BegvIK8kfBLy75GN4hSLzWxpFNH41Wx7vxwv1XR_PIJXK8v_RN2gXrGICGP71VTFu1yF658nd3WyzQCvrUm070tQjbazpsGH_ax0a8FwLaGlEXRqWsk-4iuFiWnSotaMPrx4uChJFDKl8i-ixPqL5yw7D1IqvE-tiZZ5Fy96WtBmXzFtoM1A'
    ],
    category: 'Vegetariano',
    price: 14200,
    discountPercent: 0,
    stock: 12,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 14200 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 27000 },
    ],
    seller: {
      id: 2,
      name: 'Kenji Takahashi',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmm2T1FDyOrU4jVKUDdtRAIbbVtrcvurcr7q4NuirX79pISpPwxOCHSJXTxK_er6qACmIq6ypluxkpQ80qocxDcJm6c80FYs0M_GSFiu8u8FtKzyI-ER_AWEAe-2sqSTenltnseynN4xOwZy9KtOa2EY1zRwt-1-PaQoAuA_-_O_4rf4MSWhmw5_mGvHhbS6YrkI93cOH96imaTg81OmHI5pNBzUs0TyexrJCq-MgiULrGK5uFqg8_'
    },
    rating: 4.94,
    reviewsCount: 48,
    prepMinutes: 35,
    tag: null
  },
  {
    id: 3,
    title: 'Agnolotti del plin al jugo de asado',
    description: 'Pellizcos de pasta piamontesa rellenos de estofado de tres carnes.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUe9w0m2CasN_e-nExjRX86Wi_0O_4R4PisJ6Axfr4Rg6QzxpUhAkRQZfnKQJ0aks4fpSXQDQw65tOOlqjeIpM-PeO9K6tyZA0bPybI2dlsoywdYHyHGY65UHQMeondHN9wD_U1pU_Z-UktEkWZIui9DKl5VTN5dv4AuQRFveYz5m9SEgNmkvUTHXCWxRluOqpl0n6NEt9wKWuN9re6Vwqwp3o066K_6DgziFl0JE-8S-CI57wMewc'
    ],
    category: 'Pastas',
    price: 19800,
    discountPercent: 0,
    stock: 8,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 19800 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 37600 },
    ],
    seller: {
      id: 3,
      name: 'Clara Méndez',
      avatarUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1UA-dYoobD3JbNgJWBcEdi7XPIacgEf3d-luAliCzoDi-PUmyVTYxQlS0SOjej3iFexXeh3aKn-CMw8y3aiyaVqwu4GdGo4BfO0svFrrX4S6lJXiTtNIJYE4k9j91-XSpCsb_GOtds_7225wVN5zS6v4TU19i72J338Pfkl1RKFiSFS-R2PsgxBvzOf_depxUGCknXMKfavlVgDwshe3SuDgcxra892NXtBkOMIfgIwPM0ttlrWdmNM2AE'
    },
    rating: 5,
    reviewsCount: 39,
    prepMinutes: 50,
    tag: null
  },
  {
    id: 4,
    title: 'Focaccia centenaria con higos y romero',
    description: 'Trigo molido a la piedra, higos caramelizados al horno de leña y flor de sal.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBT416oGPUaVAYYWSdD7HlusSdvg6HrfvuOkiGN4Qh6eSpEDFPSJEGA00owHnkChGynzEBARDQklRkkWRWwmwiL4UujSSv-wiOxb2wQsLcXBeLuqeBRShx_PH1HhPBm7oERWB18z_pE1NdXGf0w_m5MIxaY-w2-Udj-friBZL-37G4n0mmhqBngTsXl83Pu88VYVr8MB2wi7mOigHs4voIfuyeasgHs8haBLLmoPKrKT2NF2FQV2URk'
    ],
    category: 'Panadería',
    price: 8160,
    discountPercent: 15,
    stock: 15,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 8160 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 15500 },
    ],
    seller: {
      id: 4,
      name: 'Elena y Tomás',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0CNScmCUQLTI_BFfcyVVILISKQHUqAfVN0jR9JBVWf_UpBoeEwv1HNj6onC4tEvvuztwK45ouIDWVpP0ibQe5jC29NYT3vqSRj5c1Lu3b4GfQtGL0VM9G2PekVDXIRWZ2uO4FF8prFrNMpGomVPin_XYmCMhkjEL4KW4pkqiEFxd1suizP_8RG9K0DlMgmYkDv6pGspeIJVQhanDxqrOxYSy1eMetmar6fzpuhCbpXFKwJf0GgTpq'
    },
    rating: 4.97,
    reviewsCount: 112,
    prepMinutes: 30,
    tag: null
  },
  {
    id: 5,
    title: 'Curry verde de tubérculos y coco',
    description: 'Hierbas machacadas en mortero, leche de coco recién exprimida y calabazas asadas.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpAyO37tsQDMAOgzhJIiaPhJmq1RSdGzy2Xgv9Pb7rDbrUrSKHL25PhqOyhzPc4klrKpBv5XT2vNWdnjTI-AWVKT9Wmmo42YJ8BA2XN4pDKJokn1r4QetCdW2kS2q46S66a5v9qrEcgmmSa5hvsJ_-mth6FORWGhOldfYfOWCHNOGdNsey9ReNFRXX0GG5McpeJDKvh-mBngTMUwp4TlTmH-5Kb-3r0mqfu7CusWm5eVJn4VAxlobD'
    ],
    category: 'Vegano',
    price: 15500,
    discountPercent: 0,
    stock: 9,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 15500 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 29500 },
    ],
    seller: {
      id: 3,
      name: 'Clara Méndez',
      avatarUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1UA-dYoobD3JbNgJWBcEdi7XPIacgEf3d-luAliCzoDi-PUmyVTYxQlS0SOjej3iFexXeh3aKn-CMw8y3aiyaVqwu4GdGo4BfO0svFrrX4S6lJXiTtNIJYE4k9j91-XSpCsb_GOtds_7225wVN5zS6v4TU19i72J338Pfkl1RKFiSFS-R2PsgxBvzOf_depxUGCknXMKfavlVgDwshe3SuDgcxra892NXtBkOMIfgIwPM0ttlrWdmNM2AE'
    },
    rating: 4.91,
    reviewsCount: 27,
    prepMinutes: 40,
    tag: null
  },
  {
    id: 6,
    title: 'Panceta glaseada con manzana ahumada',
    description: 'Cocida al vacío y terminada sobre carbón, con salsa de sidra y mostaza fermentada.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCEKze5DpWrYW5JPGx9CCuojYuantsd5bK9USwbTg8_CVz3LVuW4c_Ymde6Bd9v9oq7g8Tcfom-vhrlgbjhksH3p96gxp4enxSDlAuckewr3gCvLfva2wTFgUBhG0hTDpD05he6ZW-cN5ElTC8r9_aJJc6ZyAdkKRNI1hcN85Z00sTshPw3kUEYj1k6oeVaRQrvOFiZ3DKwlEKRlZmjW9t3DQizhvMNsdVGRpmsF6afeXjwcx-q-hoX'
    ],
    category: 'Carnes',
    price: 22000,
    discountPercent: 0,
    stock: 3,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 22000 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 41800 },
    ],
    seller: {
      id: 2,
      name: 'Kenji Takahashi',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmm2T1FDyOrU4jVKUDdtRAIbbVtrcvurcr7q4NuirX79pISpPwxOCHSJXTxK_er6qACmIq6ypluxkpQ80qocxDcJm6c80FYs0M_GSFiu8u8FtKzyI-ER_AWEAe-2sqSTenltnseynN4xOwZy9KtOa2EY1zRwt-1-PaQoAuA_-_O_4rf4MSWhmw5_mGvHhbS6YrkI93cOH96imaTg81OmHI5pNBzUs0TyexrJCq-MgiULrGK5uFqg8_'
    },
    rating: 4.99,
    reviewsCount: 84,
    prepMinutes: 45,
    tag: null
  },
  {
    id: 7,
    title: 'Tagliatelle al ragú de manzo al vino tinto',
    description: 'Receta de Bolonia de tres generaciones, reducida con Malbec orgánico.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdEeu9Vzi21twtphOH7YN5tnAEyDwztJcrvDnfWX6KH-VC4sBwRZMKjr9HDP-ikd3ZaFjLb-GdugyJYGU78DTvhUZS-0wnoq4P9-QKRtf72itK0zShwngxL7TMw6Y8lqeckOxmRQFdOd9U1raltZILKCokqWPpN8VNuU0UjL3DlJeGFVWCzXR8aUB677ApLc16FXIgf_UPOuXX_UJuq1RrWaE7DRxKhXh_oUHQV5IHCGvGz_gFiCgf'
    ],
    category: 'Pastas',
    price: 15500,
    discountPercent: 0,
    stock: 0,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 15500 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 29500 },
    ],
    seller: {
      id: 1,
      name: 'Matteo Rossi',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu6f35qJvtgazdwbgtk6jDLqmfeDeP0H71PJEU3_8JZMheDYPLk36qkouZgXq1BegBZvXqe5VClD10LFTB4GScc9NPFfuoMm_C2z3AxYie4Mpoft9Nx-RddgYUWc4GL5OOYpw1_Mc0gttDIpH_8emWjlkj_CuxIXTaS4fS34XaJMnWmCiiJ8HzGYdpZrW4AAvoq2_dtuAJKFnqz9XF_vVCWDx551xmnnVAb6YVMZQDieviXDBvfMAc'
    },
    rating: 5,
    reviewsCount: 98,
    prepMinutes: 0,
    tag: null
  },
  {
    id: 8,
    title: 'Tarta tatin con manzanas asadas y cardamomo',
    description: 'Manzanas criollas de Río Negro confitadas en caramelo rubio con hojaldre de manteca.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDeSf0yqtcU6zOHQAG0p_ep86QGBRHTcMJFbutSvajweKoYwak61jeXq_Jg-qPUdYYOO9-gUfoXWwVTWyeD_gdvIniletNe7HHHXuntr6GCIUFT9zZAtjy9WZ8IZeGZUyn3eqhhQd7nw4cf15HxPpDjW-7uScQdy8pvgMUu47dYvGKlxEaRC8iqfczQOgTpCsoyV4t7PCO147hurEIEIC-klrWaTrRyufuiJR0pWpAiJghcfcFGa_47'
    ],
    category: 'Postres',
    price: 11800,
    discountPercent: 0,
    stock: 10,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 11800 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 22400 },
    ],
    seller: {
      id: 5,
      name: 'Elena Rostand',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5DpAie7Y1zW07uwUBISJ5mmV4ohApUu-aEe3Q3emCBG8-OELQDeUfPUycIiR06dG1BrrEsuDvGHacfW8Gc3pG8Hher4aj5Gn5baXbuafHQLxB1eFf6RNDzXL296fm8DY7sY-2HwMCBRpaFLiPh6a2Gt74Wg-by6ooHLs1Pn_5Re0bEr_dilIfvZRaBk9ObPbi8ojRlna248PYRvBRCMMWLvbpuoa2d69CWHt96NvS_majPYeliy-F'
    },
    rating: 4.9,
    reviewsCount: 84,
    prepMinutes: 30,
    tag: null
  },
  {
    id: 9,
    title: 'Costillar ahumado con leña de manzano',
    description: 'Nueve horas de ahumado en pozo, con puré rústico y hojas amargas.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGoG6hzzD2TYU-vW87aDQfBM3KkXRxroACBeH4Owwziy9PQ4cC9A5a-ilh6qx_e01wXKCX8UvEzxtH6DxK_k9Zzg1Sv-6HGPLhI1cmQsJdsZaOPAU0p70QdYCnpUH6EdG1pfm-_jVM3QjyNvywIkqK6y0fduE_3vtvK4UX5H8unZ1MlVFFYGxEFxs4_19W55o1vf3q2fKg9UuFsRYL87Ye97mwuWjR5sw9tgbXKZs9dBWWd2_DYBRV'
    ],
    category: 'Carnes',
    price: 18900,
    discountPercent: 0,
    stock: 7,
    portions: [
      { id: 'individual', name: 'Individual', description: 'Una porción generosa', price: 18900 },
      { id: 'compartir', name: 'Para compartir', description: 'Ideal para 2 personas', price: 35900 },
    ],
    seller: {
      id: 6,
      name: 'Camila Valenzuela',
      avatarUrl: null
    },
    rating: 4.8,
    reviewsCount: 67,
    prepMinutes: 55,
    tag: 'Carne regenerativa'
  }
]

export default PLATOS_EJEMPLO

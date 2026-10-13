/* Appetitos · comportamiento de demostración (JS plano).
   En React cada bloque pasa a ser estado de un componente; está comentado para facilitar esa migración. */
(function () {
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('es-AR'); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Menú móvil → useState(open) en <Header /> */
  var menuBtn = $('[data-menu-toggle]');
  var menu = $('#menu-movil');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.hasAttribute('hidden');
      menu.toggleAttribute('hidden', !open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menuBtn.querySelector('.material-symbols-outlined').textContent = open ? 'close' : 'menu';
    });
  }

  /* Toast → <Toast /> con contexto global */
  var toast = $('#toast');
  var toastTimer;
  function showToast(text, link) {
    if (!toast) return;
    toast.querySelector('[data-toast-text]').textContent = text;
    var a = toast.querySelector('a');
    if (a) a.hidden = !link;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3800);
  }

  /* Agregar a la cesta → addToCart(item) del CartContext */
  $$('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      var badge = $('[data-cart-count]');
      if (badge) badge.textContent = String(parseInt(badge.textContent, 10) + 1);
      showToast('Agregaste ' + (btn.getAttribute('data-name') || 'el plato') + ' a tu cesta', true);
    });
  });

  /* Favoritos */
  $$('[data-fav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.querySelector('.material-symbols-outlined').classList.toggle('fill', on);
      showToast(on ? 'Guardado en tus favoritos' : 'Quitado de tus favoritos', false);
    });
  });

  /* Galería del detalle → useState(indiceActivo) en <Gallery /> */
  var main = $('[data-gallery-main]');
  if (main) {
    var caption = $('[data-gallery-caption]');
    $$('[data-thumb]').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('[data-thumb]').forEach(function (o) { o.removeAttribute('aria-current'); });
        t.setAttribute('aria-current', 'true');
        main.src = t.getAttribute('data-full');
        main.alt = t.getAttribute('data-alt');
        if (caption) caption.textContent = t.getAttribute('data-caption');
      });
    });
  }

  /* Cantidad + totales de la cesta → useReducer en <Cart /> */
  function recalc() {
    var subtotal = 0, units = 0;
    $$('[data-group]').forEach(function (g) {
      var gSub = 0;
      $$('[data-line]', g).forEach(function (l) {
        var q = parseInt($('[data-qty] output', l).textContent, 10);
        var price = parseFloat(l.getAttribute('data-price'));
        var total = q * price;
        var out = $('[data-line-total]', l);
        if (out) out.textContent = fmt(total);
        gSub += total; units += q;
      });
      var gOut = $('[data-group-subtotal]', g);
      if (gOut) gOut.textContent = fmt(gSub);
      subtotal += gSub;
    });
    var ship = parseFloat(($('[data-summary]') || { getAttribute: function () { return 0; } }).getAttribute('data-ship') || 0);
    var set = function (sel, v) { $$(sel).forEach(function (n) { n.textContent = v; }); };
    set('[data-subtotal]', fmt(subtotal));
    set('[data-total]', fmt(subtotal + (units ? ship : 0)));
    set('[data-units]', String(units));
    set('[data-units-label]', units + (units === 1 ? ' plato' : ' platos'));
    var headerBadge = $('[data-cart-count]');
    if (headerBadge && $('[data-summary]')) headerBadge.textContent = String(units);
    var empty = $('#cesta-vacia'), full = $('#cesta-contenido');
    if (empty && full) { empty.hidden = units > 0; full.hidden = units === 0; }
  }
  $$('[data-qty]').forEach(function (box) {
    var out = $('output', box), dec = $('[data-dec]', box), inc = $('[data-inc]', box);
    var min = parseInt(box.getAttribute('data-min') || '1', 10);
    var max = parseInt(box.getAttribute('data-max') || '99', 10);
    function sync() {
      var v = parseInt(out.textContent, 10);
      dec.disabled = v <= min; inc.disabled = v >= max;
      var scope = box.closest('[data-line]') || box.parentNode; var note = scope.querySelector('[data-max-note]');
      if (note) note.hidden = v < max;
    }
    dec.addEventListener('click', function () { out.textContent = String(Math.max(min, parseInt(out.textContent, 10) - 1)); sync(); recalc(); updateAddLabel(); });
    inc.addEventListener('click', function () { out.textContent = String(Math.min(max, parseInt(out.textContent, 10) + 1)); sync(); recalc(); updateAddLabel(); });
    sync();
  });
  $$('[data-remove]').forEach(function (b) {
    b.addEventListener('click', function () {
      var line = b.closest('[data-line]');
      var group = b.closest('[data-group]');
      line.remove();
      if (group && !$('[data-line]', group)) group.remove();
      recalc();
    });
  });

  /* Selector de porción en el detalle: el precio sigue a la opción elegida */
  function updateAddLabel() {
    var sel = $('input[name="porcion"]:checked');
    var outs = $$('[data-price-out]');
    var qtyOut = $('[data-buy] [data-qty] output');
    if (!sel || !outs.length || !qtyOut) return;
    var unit = parseFloat(sel.getAttribute('data-price'));
    var q = parseInt(qtyOut.textContent, 10);
    outs.forEach(function (o) { o.textContent = fmt(unit); });
    $$('[data-add-total]').forEach(function (n) { n.textContent = fmt(unit * q); });
  }
  $$('input[name="porcion"]').forEach(function (r) { r.addEventListener('change', updateAddLabel); });
  updateAddLabel();

  /* Filtros del catálogo → estado en la URL (useSearchParams) */
  var filtersBtn = $('[data-filters-toggle]');
  var filters = $('#filtros');
  if (filtersBtn && filters) {
    filtersBtn.addEventListener('click', function () {
      var open = filters.classList.toggle('hidden');
      filtersBtn.setAttribute('aria-expanded', String(!open));
    });
  }
  $$('[data-chip-remove]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.chip').remove(); });
  });
  var clear = $('[data-clear-filters]');
  if (clear) clear.addEventListener('click', function () {
    $$('[data-applied] .chip').forEach(function (c) { c.remove(); });
    $$('#filtros input[type="checkbox"], #filtros input[type="radio"]').forEach(function (i) { i.checked = false; });
  });
  var rangeBox = $('[data-range]');
  if (rangeBox) {
    var lo = $('[data-range-min]', rangeBox), hi = $('[data-range-max]', rangeBox), fill = $('.range__fill', rangeBox);
    var loOut = $('[data-range-min-out]'), hiOut = $('[data-range-max-out]');
    var span = parseFloat(lo.max) - parseFloat(lo.min);
    function paint(e) {
      var a = parseFloat(lo.value), b = parseFloat(hi.value);
      if (a > b) { if (e && e.target === lo) { lo.value = b; a = b; } else { hi.value = a; b = a; } }
      fill.style.left = ((a - lo.min) / span * 100) + '%';
      fill.style.right = (100 - (b - lo.min) / span * 100) + '%';
      loOut.value = a; hiOut.value = b;
    }
    lo.addEventListener('input', paint); hi.addEventListener('input', paint);
    [[loOut, lo], [hiOut, hi]].forEach(function (p) {
      p[0].addEventListener('change', function () { p[1].value = p[0].value; paint(); });
    });
    paint();
  }

  /* ---------------------------------------------------------------
     Cuenta, formularios, vendedor y pedidos
     --------------------------------------------------------------- */

  /* Menú de cuenta → useState(open) + cierre al hacer clic afuera */
  var account = $('[data-account]');
  if (account) {
    document.addEventListener('click', function (e) { if (!account.contains(e.target)) account.removeAttribute('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') account.removeAttribute('open'); });
  }

  /* Mostrar u ocultar contraseña */
  $$('[data-toggle-password]').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = document.getElementById(b.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.textContent = show ? 'Ocultar' : 'Mostrar';
    });
  });

  /* Validación → una función validate(values) que devuelve { campo: mensaje } */
  function setError(field, msg) {
    var id = field.id;
    var box = document.querySelector('[data-err-for="' + id + '"]');
    var hint = document.querySelector('[data-hint-for="' + id + '"]');
    field.setAttribute('aria-invalid', 'true');
    if (box) { box.querySelector('[data-err-text]').textContent = msg; box.hidden = false; field.setAttribute('aria-describedby', 'err-' + id); box.id = 'err-' + id; }
    if (hint) hint.hidden = true;
  }
  function clearError(field) {
    var id = field.id;
    var box = document.querySelector('[data-err-for="' + id + '"]');
    var hint = document.querySelector('[data-hint-for="' + id + '"]');
    field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby');
    if (box) box.hidden = true;
    if (hint) hint.hidden = false;
  }
  function validate(form) {
    var bad = [];
    $$('.field[required]', form).forEach(function (f) {
      clearError(f);
      if (!f.checkValidity() || (f.type !== 'number' && !f.value.trim())) { setError(f, f.getAttribute('data-msg') || 'Completá este campo.'); bad.push(f); }
    });
    var photos = $('[data-photos]', form);
    if (photos) {
      var pe = document.querySelector('[data-err-for="fotos"]');
      var none = !photos.children.length;
      if (pe) { pe.hidden = !none; if (none) pe.querySelector('[data-err-text]').textContent = 'Subí al menos una foto del plato.'; }
      if (none) bad.push($('[data-photos-input]', form));
    }
    return bad;
  }
  $$('form[data-validate]').forEach(function (form) {
    form.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('field') && e.target.getAttribute('aria-invalid')) clearError(e.target); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var banner = $('#form-error');
      if (banner) banner.hidden = true;
      var bad = validate(form);
      if (bad.length) {
        if (banner && form.hasAttribute('data-publish')) {
          banner.querySelector('[data-error-title]').textContent = bad.length === 1 ? 'Falta 1 dato para publicar' : 'Faltan ' + bad.length + ' datos para publicar';
          banner.hidden = false;
        }
        bad[0].focus();
        return;
      }
      var kind = form.getAttribute('data-auth');
      if (kind === 'login' && $('#clave', form).value === 'error1234') {
        banner.hidden = false; $('#clave', form).value = ''; $('#usuario', form).focus(); return;
      }
      if (kind === 'register' && $('#usuario', form).value.toLowerCase() === 'clara.mendez') {
        setError($('#usuario', form), 'Ese usuario ya está en uso. Probá con clara.mendez2.'); $('#usuario', form).focus(); return;
      }
      var go = form.getAttribute('data-redirect') || 'index.html';
      if (kind === 'register' && $('input[name="rol"]:checked', form).value === 'vendedor') go = 'publicaciones.html';
      showToast(kind === 'login' ? 'Ingresaste a tu cuenta' : kind === 'register' ? 'Cuenta creada' : 'Plato publicado', false);
      setTimeout(function () { location.href = go; }, 900);
    });
  });
  var rolParam = new URLSearchParams(location.search).get('rol');
  if (rolParam) { var r = $('input[name="rol"][value="' + rolParam + '"]'); if (r) r.checked = true; }

  /* Publicar / editar un plato ------------------------------------ */
  var pubForm = $('form[data-publish]');
  if (pubForm) {
    var photosBox = $('[data-photos]', pubForm), fileInput = $('[data-photos-input]', pubForm), dz = $('[data-dropzone]', pubForm);
    var pv = { img: $('[data-pv-img]'), empty: $('[data-pv-empty]'), title: $('[data-pv-title]'), desc: $('[data-pv-desc]'), price: $('[data-pv-price]'), old: $('[data-pv-old]'), stock: $('[data-pv-stock]'), badge: $('[data-pv-badge]') };
    var refresh = function () {
      var v = function (id) { return ($('#' + id, pubForm) || {}).value || ''; };
      var price = parseFloat(v('precio')) || 0, disc = $('[data-discount-toggle]', pubForm).checked ? (parseFloat(v('dpct')) || 0) : 0;
      var final = Math.round(price * (1 - disc / 100));
      pv.title.textContent = v('titulo').trim() || 'Nombre del plato';
      pv.desc.textContent = v('descripcion').trim() || 'La descripción aparece acá.';
      pv.price.textContent = fmt(final);
      pv.old.hidden = !(disc > 0 && price > 0); pv.old.textContent = fmt(price);
      pv.badge.hidden = !(disc > 0 && price > 0); pv.badge.textContent = '−' + disc + '%';
      var s = v('stock');
      pv.stock.textContent = s === '' ? 'Sin stock cargado' : parseInt(s, 10) === 0 ? 'Sin stock por hoy' : parseInt(s, 10) <= 5 ? 'Quedan ' + s + ' hoy' : (v('porcion') || 'Disponible');
      var first = photosBox.querySelector('img');
      pv.img.hidden = !first; pv.img.classList.toggle('hidden', !first); pv.empty.hidden = !!first;
      if (first) { pv.img.src = first.src; }
    };
    var addPhoto = function (src) {
      if (photosBox.children.length >= 6) { showToast('Podés subir hasta 6 fotos', false); return; }
      var li = document.createElement('li');
      li.className = 'relative aspect-square overflow-hidden rounded-md bg-surface-container';
      li.innerHTML = '<img alt="" class="h-full w-full object-cover"><button type="button" class="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-primary shadow-sm" aria-label="Quitar foto"><span class="material-symbols-outlined text-[18px]">close</span></button>';
      li.querySelector('img').src = src;
      li.querySelector('button').addEventListener('click', function () { li.remove(); markMain(); refresh(); });
      photosBox.appendChild(li); markMain(); refresh();
      var pe = document.querySelector('[data-err-for="fotos"]'); if (pe) pe.hidden = true;
    };
    var markMain = function () {
      $$('[data-main-tag]', photosBox).forEach(function (n) { n.remove(); });
      var first = photosBox.firstElementChild;
      if (first) first.insertAdjacentHTML('beforeend', '<span data-main-tag class="absolute bottom-1 left-1 rounded-full bg-primary-container px-2 py-0.5 text-label-sm text-on-primary">Principal</span>');
    };
    var addFiles = function (files) { Array.prototype.forEach.call(files, function (f) { if (/^image\//.test(f.type)) addPhoto(URL.createObjectURL(f)); }); };
    fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { dz.addEventListener(t, function () { dz.classList.remove('is-over'); }); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); addFiles(e.dataTransfer.files); });
    pubForm.addEventListener('input', refresh);
    $('[data-discount-toggle]', pubForm).addEventListener('change', function (e) { $('[data-discount-box]', pubForm).classList.toggle('hidden', !e.target.checked); refresh(); });
    $('[data-draft]', pubForm).addEventListener('click', function () { showToast('Borrador guardado', false); });
    // Modo edición: ?editar=1 carga un plato de ejemplo
    if (/editar/.test(location.search)) {
      $('[data-h1]').textContent = 'Editar plato'; $('[data-crumb]').textContent = 'Editar plato'; $('[data-submit-label]').textContent = 'Guardar cambios';
      var set = function (id, val) { $('#' + id, pubForm).value = val; };
      set('titulo', 'Ravioli de ricotta de oveja y hongos silvestres'); set('descripcion', 'Moldeados a mano, uno por uno, con manteca tostada, salvia crujiente y un toque de avellanas del bosque.');
      set('categoria', 'Pastas y masas'); set('porcion', 'Individual · 320 g'); set('precio', '14200'); set('stock', '6');
      (pubForm.getAttribute('data-edit-photos') || '').split('|').forEach(function (u) { if (u) addPhoto(u); });
    }
    refresh();
  }

  /* Mis publicaciones: stock, descuento y eliminar --------------- */
  var pubList = $('[data-pub-list]');
  if (pubList) {
    var current = null, filter = 'all';
    var statusOf = function (li) {
      var s = parseInt($('[data-qty] output', li).textContent, 10);
      var el = $('[data-stock-status]', li);
      li.setAttribute('data-stock', s);
      el.className = 'badge ' + (s === 0 ? 'badge-mute' : s <= 5 ? 'badge-terra' : 'badge-leaf');
      el.innerHTML = s === 0 ? 'Sin stock' : s <= 5 ? '<span class="dot"></span>Quedan ' + s : 'Publicado';
    };
    var priceOf = function (li) {
      var base = parseFloat(li.getAttribute('data-price')), d = parseFloat(li.getAttribute('data-discount'));
      $('[data-price-now]', li).textContent = fmt(Math.round(base * (1 - d / 100)));
      var old = $('[data-price-old]', li), bd = $('[data-price-badge]', li);
      old.hidden = bd.hidden = !(d > 0); old.textContent = fmt(base); bd.textContent = '−' + d + '%';
    };
    var apply = function () {
      var rows = $$('[data-pub]', pubList), visible = 0, n = { all: rows.length, stock: 0, out: 0, disc: 0 };
      rows.forEach(function (li) {
        var s = parseInt(li.getAttribute('data-stock'), 10), d = parseFloat(li.getAttribute('data-discount'));
        if (s > 0) n.stock++; else n.out++; if (d > 0) n.disc++;
        var show = filter === 'all' || (filter === 'stock' && s > 0) || (filter === 'out' && s === 0) || (filter === 'disc' && d > 0);
        li.hidden = !show; if (show) visible++;
      });
      ['all', 'stock', 'out', 'disc'].forEach(function (k) { var c = $('[data-count-' + k + ']'); if (c) c.textContent = n[k]; });
      $('#pub-vacio').hidden = visible > 0;
    };
    $$('[data-pub]', pubList).forEach(function (li) { statusOf(li); priceOf(li); });
    apply();
    pubList.addEventListener('click', function (e) {
      var btn = e.target.closest('.qty button'); if (!btn) return;
      var li = btn.closest('[data-pub]');
      /* el listener del botón (más arriba) ya actualizó el <output>; acá solo se refleja el estado */
      statusOf(li); apply();
      var s = parseInt(li.getAttribute('data-stock'), 10);
      showToast(s === 0 ? 'Stock actualizado: sin stock, ya no se puede agregar a la cesta' : 'Stock actualizado: ' + s + (s === 1 ? ' porción' : ' porciones'), false);
    });
    $$('[data-pub-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-pub-filter');
        $$('[data-pub-filter]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        apply();
      });
    });
    var dEl = $('#dlg-eliminar'), dDesc = $('#dlg-descuento'), pct = $('#desc-pct');
    pubList.addEventListener('click', function (e) {
      var del = e.target.closest('[data-open-delete]'), dis = e.target.closest('[data-open-discount]');
      if (del) { current = del.closest('[data-pub]'); $('[data-dlg-title]', dEl).textContent = current.getAttribute('data-title'); dEl.showModal(); }
      if (dis) {
        current = dis.closest('[data-pub]'); $('[data-dlg-title]', dDesc).textContent = current.getAttribute('data-title');
        pct.value = current.getAttribute('data-discount'); $('[data-dlg-original]', dDesc).textContent = fmt(parseFloat(current.getAttribute('data-price'))); previewDiscount(); dDesc.showModal();
      }
    });
    function previewDiscount() {
      var base = parseFloat(current.getAttribute('data-price')), d = Math.min(90, Math.max(0, parseFloat(pct.value) || 0));
      $('[data-dlg-final]', dDesc).textContent = fmt(Math.round(base * (1 - d / 100)));
    }
    pct.addEventListener('input', previewDiscount);
    dEl.addEventListener('close', function () {
      if (dEl.returnValue === 'confirm' && current) { current.remove(); apply(); showToast('Plato eliminado', false); }
      dEl.returnValue = '';
    });
    dDesc.addEventListener('close', function () {
      if (dDesc.returnValue === 'confirm' && current) {
        current.setAttribute('data-discount', Math.min(90, Math.max(0, parseFloat(pct.value) || 0)));
        priceOf(current); apply(); showToast('Descuento aplicado', false);
      }
      dDesc.returnValue = '';
    });
  }

  /* Mis pedidos: pestañas y cancelar ------------------------------ */
  var tabsBox = $('[data-tabs]');
  if (tabsBox) {
    var tabs = $$('[role="tab"]', tabsBox);
    var select = function (t) {
      tabs.forEach(function (o) {
        var on = o === t; o.setAttribute('aria-selected', String(on)); o.tabIndex = on ? 0 : -1;
        document.getElementById(o.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; select(n); n.focus(); }
      });
    });
    if (/nuevo/.test(location.search)) $('#aviso-nuevo').hidden = false;
    var dc = $('#dlg-cancelar'), target = null;
    $$('[data-open-cancel]').forEach(function (b) { b.addEventListener('click', function () { target = b.closest('article'); dc.showModal(); }); });
    dc.addEventListener('close', function () {
      if (dc.returnValue === 'confirm' && target) {
        target.remove(); var c = $('#tab-curso .tabular'); c.textContent = String(Math.max(0, parseInt(c.textContent, 10) - 1)); showToast('Pedido cancelado', false);
      }
      dc.returnValue = '';
    });
  }
})();

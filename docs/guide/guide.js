// Mounts each vector picture in its own shadow root (so the app's real stylesheet applies without touching the guide's styles),
// then scales it so the WHOLE picture fits its box. Nothing is ever cropped. Also places the numbered markers on the annotated screen.
(() => {
  const MM = 3.7795, PX_MM = 0.2646
  const appCss = document.getElementById('app-css').textContent
  function boot() {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(appCss)
    const extra = new CSSStyleSheet()
    extra.replaceSync(`:host{display:block;font-family:"Instrument Sans Variable","Segoe UI",system-ui,sans-serif;color:#171717;line-height:1.5;-webkit-font-smoothing:antialiased;text-align:left}
      .vis-static .fixed{position:static!important;inset:auto!important}
      .vis-static [data-testid=tour]{width:24rem;max-width:100%}
      *{animation:none!important}`)
    document.querySelectorAll('.vis').forEach((v) => {
      const inn = v.querySelector('.vis-in'), box = v.querySelector('.vis-box'), w = +v.dataset.w
      const root = inn.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet, extra]
      root.append(v.querySelector('template').content.cloneNode(true))
      inn.style.width = w + 'px'
      const h = inn.offsetHeight
      const s = Math.min((+v.dataset.maxw * MM) / w, (+v.dataset.maxh * MM) / h, +v.dataset.cap / PX_MM)
      box.style.width = w * s + 'px'; box.style.height = h * s + 'px'
      inn.style.transform = `scale(${s})`
    })
    document.querySelectorAll('.annot').forEach((annot) => {
      const root = annot.querySelector('.vis-in').shadowRoot, a = annot.getBoundingClientRect()
      annot.querySelectorAll('.badge[data-target]').forEach((b) => {
        const el = root.querySelector(b.dataset.target)
        if (!el) { b.remove(); return }
        const r = el.getBoundingClientRect()
        b.style.left = r.left - a.left + 'px'; b.style.top = r.top - a.top + 'px'
      })
    })
    window.__visReady = true
  }
  ;(document.fonts ? document.fonts.ready : Promise.resolve()).then(boot)
})()

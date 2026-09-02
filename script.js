(function(){
  // ===== NAV: scroll shadow + mobile menu (every page) =====
  const nav = document.getElementById("siteNav");
  if (nav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    });
  }
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      navToggle.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
      });
    });
  }

  // ===== GALLERY + LIGHTBOX (only runs if this page has a grid + photo list) =====
  const gridEl = document.getElementById("galleryGrid");
  const photos = window.SITE_PHOTOS;
  if (!gridEl || !photos) return;

  const countEl = document.getElementById("galeriaCount");
  if (countEl) countEl.textContent = photos.length + " photos";

  gridEl.innerHTML = photos.map((photo, index) => `
    <div class="plate" data-index="${index}">
      <img src="${photo}.jpg" alt="Photograph ${photo}" loading="lazy" decoding="async">
    </div>
  `).join("");

  const lightbox = document.getElementById("lightbox");
  const stage = document.getElementById("lbStage");
  const lightboxImage = document.getElementById("lbImg");
  const imageNumber = document.getElementById("lbNum");
  const imageCounter = document.getElementById("lbCount");
  let currentPhoto = 0;

  let scale = 1, tx = 0, ty = 0;
  let originX = 50, originY = 50;
  let dragging = false, dragStart = {x:0,y:0}, startTxTy = {x:0,y:0};
  let pinchStartDist = null, pinchStartScale = 1;
  let movedDuringPress = false;
  const MIN_SCALE = 1, MAX_SCALE = 4, ZOOM_STEP_CLICK = 2.4;

  function applyTransform(){
    lightboxImage.style.transformOrigin = originX + '% ' + originY + '%';
    lightboxImage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    lightboxImage.classList.toggle('zoomed', scale > 1);
  }
  function resetZoom(){ scale=1; tx=0; ty=0; originX=50; originY=50; applyTransform(); }
  function preload(i){
    const photo = photos[(i + photos.length) % photos.length];
    const im = new Image(); im.src = `${photo}.jpg`;
  }
  function updateLightbox(){
    const photo = photos[currentPhoto];
    lightboxImage.src = `${photo}.jpg`;
    lightboxImage.alt = `Photograph ${photo}`;
    imageNumber.textContent = `No. ${photo}`;
    imageCounter.textContent = `${currentPhoto + 1} / ${photos.length}`;
    resetZoom();
    preload(currentPhoto + 1); preload(currentPhoto - 1);
  }
  function openLightbox(index){
    currentPhoto = index;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    updateLightbox();
  }
  function closeLightbox(){
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    lightboxImage.src = "";
  }
  function go(delta){
    lightboxImage.classList.add('fading');
    setTimeout(() => {
      currentPhoto = (currentPhoto + delta + photos.length) % photos.length;
      updateLightbox();
      lightboxImage.classList.remove('fading');
    }, 90);
  }

  gridEl.addEventListener("click", (event) => {
    const item = event.target.closest(".plate");
    if(item) openLightbox(Number(item.dataset.index));
  });

  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lbNext").addEventListener("click", () => go(1));
  document.getElementById("lbPrev").addEventListener("click", () => go(-1));
  stage.addEventListener("click", (event) => { if(event.target === stage) closeLightbox(); });

  document.addEventListener("keydown", (event) => {
    if(!lightbox.classList.contains("open")) return;
    if(event.key === "Escape") closeLightbox();
    if(event.key === "ArrowRight") go(1);
    if(event.key === "ArrowLeft") go(-1);
    if(event.key === "+" || event.key === "=") { scale = Math.min(MAX_SCALE, scale + 0.4); applyTransform(); }
    if(event.key === "-") { scale = Math.max(MIN_SCALE, scale - 0.4); if(scale===1){tx=0;ty=0;originX=50;originY=50;} applyTransform(); }
    if(event.key === "0") resetZoom();
  });

  lightboxImage.addEventListener('click', (e) => {
    e.stopPropagation();
    if (movedDuringPress) { movedDuringPress = false; return; }
    const rect = lightboxImage.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    if (scale === 1) { originX = px; originY = py; scale = ZOOM_STEP_CLICK; tx = 0; ty = 0; }
    else { scale = 1; tx = 0; ty = 0; originX = 50; originY = 50; }
    applyTransform();
  });

  stage.addEventListener('wheel', (e) => {
    if (!lightbox.classList.contains('open')) return;
    e.preventDefault();
    const rect = lightboxImage.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const prevScale = scale;
    scale += (e.deltaY < 0 ? 0.35 : -0.35);
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    if (scale === 1) { tx = 0; ty = 0; originX = 50; originY = 50; }
    else if (prevScale === 1) { originX = px; originY = py; tx = 0; ty = 0; }
    applyTransform();
  }, { passive:false });

  lightboxImage.addEventListener('mousedown', (e) => {
    if (scale === 1) return;
    dragging = true; movedDuringPress = false;
    dragStart = { x:e.clientX, y:e.clientY }; startTxTy = { x:tx, y:ty };
    lightboxImage.classList.add('dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedDuringPress = true;
    tx = startTxTy.x + dx; ty = startTxTy.y + dy;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; lightboxImage.classList.remove('dragging'); }
  });

  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const [a,b] = e.touches;
      pinchStartDist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      pinchStartScale = scale;
      const rect = lightboxImage.getBoundingClientRect();
      originX = ((((a.clientX+b.clientX)/2) - rect.left) / rect.width) * 100;
      originY = ((((a.clientY+b.clientY)/2) - rect.top) / rect.height) * 100;
    } else if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now();
      if (scale > 1) { dragging = true; dragStart = { x:touchStartX, y:touchStartY }; startTxTy = { x:tx, y:ty }; }
    }
  }, { passive:true });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStartDist) {
      const [a,b] = e.touches;
      const dist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale * (dist / pinchStartDist)));
      applyTransform();
    } else if (e.touches.length === 1 && dragging && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.x, dy = e.touches[0].clientY - dragStart.y;
      tx = startTxTy.x + dx; ty = startTxTy.y + dy;
      applyTransform();
    }
  }, { passive:true });

  stage.addEventListener('touchend', (e) => {
    if (dragging) dragging = false;
    if (pinchStartDist) {
      pinchStartDist = null;
      if (scale <= 1.02) { scale = 1; tx = 0; ty = 0; originX = 50; originY = 50; applyTransform(); }
      return;
    }
    if (scale === 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX, dy = e.changedTouches[0].clientY - touchStartY;
      const dt = Date.now() - touchStartTime;
      if (dt < 500 && Math.abs(dx) > 55 && Math.abs(dy) < 80) go(dx < 0 ? 1 : -1);
    }
  }, { passive:true });
})();

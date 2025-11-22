const navLinks = document.querySelectorAll('.nav-link');
const activeUnderline = document.querySelector('.active-underline');
const selector = document.getElementById('selector');
const knob = document.getElementById('knob');
const hero = document.getElementById('hero');
const carousel = document.getElementById('carousel');

let dragging = false;
let dragStartX = 0;
let knobStartLeft = 12;
let selectorState = 'off';
let locked = true;
let listenersBound = false;
let unlockedOnce = false;

function updateUnderline() {
  const active = document.querySelector('.nav-link.active');
  if (!active) return;
  const rect = active.getBoundingClientRect();
  const parentRect = active.parentElement.getBoundingClientRect();
  activeUnderline.style.width = `${rect.width}px`;
  activeUnderline.style.transform = `translateX(${rect.left - parentRect.left}px)`;
}

function setActiveLinkBySection() {
  const sections = ['destaque', 'links'];
  let current = sections[0];
  sections.forEach(id => {
    const el = document.getElementById(id);
    const top = el.getBoundingClientRect().top;
    if (top <= 72) current = id;
  });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
  updateUnderline();
}

window.addEventListener('resize', updateUnderline);
window.addEventListener('scroll', setActiveLinkBySection);
document.addEventListener('DOMContentLoaded', () => {
  updateUnderline();
  revealOnScroll();
  setupSelector();
  setupCarousel();
  setupShare();
  setupAvatarUpload();
  lockPage();
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.getElementById('hero').scrollIntoView({ behavior: 'auto', block: 'center' });
  }, 0);
});

window.addEventListener('pageshow', (e) => {
  resetSelector();
  lockPage();
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.getElementById('hero').scrollIntoView({ behavior: 'auto', block: 'center' });
  }, 0);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateUnderline).catch(() => {});
}
window.addEventListener('load', () => {
  updateUnderline();
});

function revealOnScroll() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function setupSelector() {
  let maxSlide = selector.clientWidth - knob.clientWidth - 24; // padding total

  const applyStateVisual = () => {
    selector.dataset.state = selectorState;
    selector.setAttribute('aria-pressed', selectorState === 'on' ? 'true' : 'false');
    if (selectorState === 'on') {
      knob.style.left = `${12 + maxSlide}px`;
    } else {
      knob.style.left = '12px';
    }
  };

  const trigger = () => {
    if (selectorState === 'off') {
      selectorState = 'on';
      applyStateVisual();
      startUnlockFlow();
    } else {
      applyStateVisual();
    }
  };

  const onPointerDown = (e) => {
    dragging = true;
    dragStartX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
    const style = getComputedStyle(knob);
    knobStartLeft = parseFloat(style.left);
    selector.style.userSelect = 'none';
    knob.style.transition = 'none';
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX || (e.touches?.[0]?.clientX ?? 0);
    let delta = x - dragStartX;
    let next = Math.min(Math.max(knobStartLeft + delta, 12), 12 + maxSlide);
    knob.style.left = `${next}px`;

    // desbloquear imediatamente ao exceder o limiar durante o arraste
    const threshold = 12 + maxSlide * 0.7;
    if (next >= threshold && selectorState === 'off') {
      dragging = false;
      selectorState = 'on';
      knob.style.left = `${12 + maxSlide}px`;
      applyStateVisual();
      startUnlockFlow();
    }
  };

  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;
    const left = parseFloat(getComputedStyle(knob).left);
    knob.style.transition = '';
    selectorState = left > 12 + maxSlide * 0.65 ? 'on' : 'off';
    applyStateVisual();
    if (selectorState === 'on') startUnlockFlow();
    selector.style.userSelect = '';
  };

  selector.addEventListener('mousedown', onPointerDown);
  selector.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);

  selector.addEventListener('click', (e) => {
    if (!dragging) trigger();
  });

  // initial state
  selectorState = 'off';
  applyStateVisual();

  window.addEventListener('resize', () => {
    maxSlide = selector.clientWidth - knob.clientWidth - 24;
    applyStateVisual();
  });
}

function startUnlockFlow() {
  if (unlockedOnce) return;
  unlockedOnce = true;
  unlockPage();
  hero.classList.add('fade-out');
  setTimeout(() => {
    document.getElementById('destaque').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => hero.style.display = 'none', 600);
  }, 100);
}

function setupCarousel() {
  const container = document.querySelector('.carousel-wrapper');
  const track = carousel;
  const baseItems = Array.from(track.children);

  const ensureClones = () => {
    if (track.dataset.cloned === 'true') return;
    const getTrackWidth = () => track.scrollWidth;
    const minWidth = container.clientWidth * 3;
    let safety = 0;
    while (getTrackWidth() < minWidth && safety < 20) {
      baseItems.forEach(node => track.appendChild(node.cloneNode(true)));
      safety++;
    }
    track.dataset.cloned = 'true';
  };

  ensureClones();
  window.addEventListener('load', () => setTimeout(ensureClones, 0));

  let speed = 0.6; // px per frame
  let paused = false;
  const step = () => {
    if (!paused) {
      container.scrollLeft += speed;
      const max = track.scrollWidth - container.clientWidth - 2;
      if (container.scrollLeft >= max) {
        container.scrollLeft = container.scrollLeft - (track.scrollWidth / 3);
      }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  container.addEventListener('pointerenter', () => paused = true);
  container.addEventListener('pointerleave', () => paused = false);

  let isDrag = false; let dragX = 0; let startScroll = 0;
  container.addEventListener('mousedown', (e) => { isDrag = true; dragX = e.clientX; startScroll = container.scrollLeft; paused = true; });
  container.addEventListener('mousemove', (e) => { if (isDrag) { const dx = e.clientX - dragX; container.scrollLeft = startScroll - dx; } });
  window.addEventListener('mouseup', () => { isDrag = false; paused = false; });
  container.addEventListener('touchstart', (e) => { isDrag = true; dragX = e.touches[0].clientX; startScroll = container.scrollLeft; paused = true; }, { passive: true });
  container.addEventListener('touchmove', (e) => { if (isDrag) { const dx = e.touches[0].clientX - dragX; container.scrollLeft = startScroll - dx; } }, { passive: true });
  container.addEventListener('touchend', () => { isDrag = false; paused = false; });

  document.querySelector('.arrow.left').addEventListener('click', () => { container.scrollLeft -= container.clientWidth * 0.8; });
  document.querySelector('.arrow.right').addEventListener('click', () => { container.scrollLeft += container.clientWidth * 0.8; });
}

function lockPage() {
  locked = true;
  document.body.classList.add('locked');
  if (!listenersBound) {
    const blockScroll = (e) => { if (locked) e.preventDefault(); };
    const blockKeys = (e) => {
      if (!locked) return;
      const keys = ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '];
      if (keys.includes(e.key)) e.preventDefault();
    };
    window.addEventListener('wheel', blockScroll, { passive: false });
    window.addEventListener('touchmove', blockScroll, { passive: false });
    window.addEventListener('keydown', blockKeys, { passive: false });
    navLinks.forEach(a => a.addEventListener('click', (ev) => { if (locked) ev.preventDefault(); }));
    listenersBound = true;
  }
}

function unlockPage() {
  locked = false;
  document.body.classList.remove('locked');
  setTimeout(updateUnderline, 0);
}

function resetSelector() {
  selectorState = 'off';
  unlockedOnce = false;
  if (hero) {
    hero.style.display = '';
    hero.classList.remove('fade-out');
  }
  if (knob) {
    knob.style.transition = '';
    knob.style.left = '12px';
  }
  selector?.setAttribute('aria-pressed', 'false');
  selector?.setAttribute('data-state', 'off');
}

function setupShare() {
  const btn = document.getElementById('shareBtn');
  btn.addEventListener('click', async () => {
    const shareData = { title: document.title, text: 'Confira minha central de links', url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(location.href);
        btn.textContent = 'Link copiado!';
        setTimeout(() => btn.textContent = 'Compartilhar', 1500);
      }
    } catch (e) {
      console.error(e);
    }
  });
}

function setupAvatarUpload() {
  const input = document.getElementById('avatarInput');
  const main = document.getElementById('avatarMain');
  const small = document.getElementById('avatarSmall');
  if (!input || !main || !small) return;
  const defaultLarge = main.getAttribute('data-default-large') || main.src;
  const defaultSmall = small.getAttribute('data-default-small') || small.src;
  const applyFile = (file) => {
    const url = URL.createObjectURL(file);
    main.src = url;
    small.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    main.onload = cleanup;
    small.onload = cleanup;
  };
  const applyUrl = (url) => {
    main.src = url;
    small.src = url;
  };
  const qp = new URLSearchParams(location.search);
  const fromQuery = qp.get('photo');
  const fromGlobal = typeof window.PROFILE_PHOTO_URL === 'string' ? window.PROFILE_PHOTO_URL : '';
  if (fromQuery) applyUrl(fromQuery);
  else if (fromGlobal) applyUrl(fromGlobal);
  else applyUrl(defaultLarge);
  main.onerror = () => { main.src = defaultLarge; };
  small.onerror = () => { small.src = defaultSmall; };
  input.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  });
  main.addEventListener('click', () => input.click());
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.type.startsWith('image/')) { applyFile(it.getAsFile()); break; }
    }
  });
  document.addEventListener('dragover', (e) => { e.preventDefault(); });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) applyFile(f);
  });
}

// small fade-out style for hero transition
const style = document.createElement('style');
style.innerHTML = `#hero.fade-out { opacity: 0; transform: scale(0.98); transition: all .5s ease-in-out; }`;
document.head.appendChild(style);
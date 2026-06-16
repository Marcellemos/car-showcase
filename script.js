/* =====================================================================
   VELOCITÀ — Premium Car Showcase Slider
   JavaScript: slide switching, autoplay/progress bar, reveal
   animations, pagination, thumbnails, swipe & keyboard support.
   ===================================================================== */

(() => {
  'use strict';

  /* -------------------------------------------------------------
     0. CONFIG — keep AUTOPLAY_MS in sync with the
        --autoplay-duration CSS custom property in style.css
  ------------------------------------------------------------- */
  const AUTOPLAY_MS = 6000;

  /* -------------------------------------------------------------
     1. DOM REFERENCES
  ------------------------------------------------------------- */
  const slider       = document.getElementById('slider');
  const slides       = Array.from(document.querySelectorAll('.slide'));
  const prevBtn      = document.getElementById('prevBtn');
  const nextBtn      = document.getElementById('nextBtn');
  const progressFill = document.getElementById('progressFill');
  const dots         = Array.from(document.querySelectorAll('.pagination__dot'));
  const thumbs       = Array.from(document.querySelectorAll('.thumb'));
  const counterEl    = document.getElementById('counterCurrent');

  const TOTAL = slides.length;
  let current = 0;
  let isPaused = false;

  /* -------------------------------------------------------------
     2. HELPERS
  ------------------------------------------------------------- */

  /**
   * Convert a hex colour ("#rrggbb") into an "r, g, b" string so it can
   * be combined with an alpha value for the per-slide glow accents.
   */
  function hexToRgbString(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  /**
   * Force the browser to restart a CSS animation on an element by
   * removing the animating class, triggering a synchronous reflow
   * (reading offsetWidth), then re-adding the class.
   */
  function restartAnimation(el, className) {
    if (!el) return;
    el.classList.remove(className);
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth; // force reflow
    el.classList.add(className);
  }

  /**
   * Restart the autoplay progress bar fill animation. When it finishes
   * naturally (animationend, not interrupted), the slider auto-advances.
   */
  function restartProgressBar() {
    restartAnimation(progressFill, 'running');
  }

  /* -------------------------------------------------------------
     3. CORE SLIDE TRANSITION
  ------------------------------------------------------------- */

  /**
   * Activate the slide at `index`, deactivating the current one and
   * (re)triggering every staggered entrance animation: the hero image
   * slide-in/zoom, the info-panel's fade-up-scale sequence, the
   * per-slide accent colour, pagination, thumbnails and counter.
   */
  function goToSlide(index) {
    const nextIndex = ((index % TOTAL) + TOTAL) % TOTAL; // wrap both directions
    if (nextIndex === current) return;

    const outgoing = slides[current];
    const incoming = slides[nextIndex];

    // --- Deactivate outgoing slide & reset its reveal animations ---
    outgoing.classList.remove('active');
    const outgoingPanel = outgoing.querySelector('.info-panel');
    const outgoingImage = outgoing.querySelector('.slide__image-wrap');
    outgoingPanel.classList.remove('reveal');
    outgoingImage.classList.remove('reveal');

    // --- Activate incoming slide ---
    incoming.classList.add('active');

    // --- Update the global accent theme to match the new car ---
    const accent = incoming.dataset.accent || '#d4af6a';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${hexToRgbString(accent)}, 0.35)`);

    // --- (Re)trigger the staggered text reveal + image slide-in/zoom.
    //     A short timeout ensures the `.active` opacity transition has
    //     started before the child animations fire, so they read as
    //     part of the same cinematic beat rather than instant pops. ---
    const incomingPanel = incoming.querySelector('.info-panel');
    const incomingImage = incoming.querySelector('.slide__image-wrap');
    requestAnimationFrame(() => {
      restartAnimation(incomingPanel, 'reveal');
      restartAnimation(incomingImage, 'reveal');
    });

    // --- Sync pagination dots ---
    dots.forEach((dot, i) => {
      const active = i === nextIndex;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // --- Sync thumbnails ---
    thumbs.forEach((thumb, i) => {
      const active = i === nextIndex;
      thumb.classList.toggle('active', active);
      if (active) {
        thumb.setAttribute('aria-current', 'true');
        // keep the active thumbnail visible if the strip is scrollable
        thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        thumb.removeAttribute('aria-current');
      }
    });

    // --- Sync slide counter ---
    counterEl.textContent = String(nextIndex + 1).padStart(2, '0');

    current = nextIndex;

    // --- Restart the autoplay progress bar for the new slide ---
    restartProgressBar();
  }

  function nextSlide() { goToSlide(current + 1); }
  function prevSlide() { goToSlide(current - 1); }

  /* -------------------------------------------------------------
     4. AUTOPLAY — driven by the progress bar's animationend event.
        Pausing is handled purely with CSS (animation-play-state),
        triggered by adding/removing `.is-paused` on the slider, so
        the bar visually freezes mid-fill and resumes seamlessly.
  ------------------------------------------------------------- */
  progressFill.addEventListener('animationend', (e) => {
    if (e.animationName !== 'progressFill') return;
    if (isPaused) return; // safety guard
    nextSlide();
  });

  function pauseAutoplay() {
    isPaused = true;
    slider.classList.add('is-paused');
  }

  function resumeAutoplay() {
    isPaused = false;
    slider.classList.remove('is-paused');
  }

  /* -------------------------------------------------------------
     5. NAVIGATION CONTROLS
  ------------------------------------------------------------- */

  prevBtn.addEventListener('click', () => {
    prevSlide();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
  });

  // Ripple hover position: track pointer so the .btn::after radial
  // gradient (defined in CSS) expands from the cursor.
  document.querySelectorAll('.btn, .nav-btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--mx', `${mx}%`);
      btn.style.setProperty('--my', `${my}%`);
    });
  });

  /* -------------------------------------------------------------
     6. PAGINATION DOTS
  ------------------------------------------------------------- */
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.index);
      goToSlide(index);
    });
  });

  /* -------------------------------------------------------------
     7. THUMBNAIL NAVIGATION
  ------------------------------------------------------------- */
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const index = Number(thumb.dataset.index);
      goToSlide(index);
    });
  });

  /* -------------------------------------------------------------
     8. PAUSE-ON-HOVER (mouse) & PAUSE-ON-TOUCH (mobile)
  ------------------------------------------------------------- */
  slider.addEventListener('mouseenter', pauseAutoplay);
  slider.addEventListener('mouseleave', resumeAutoplay);
  slider.addEventListener('focusin', pauseAutoplay);
  slider.addEventListener('focusout', resumeAutoplay);

  /* -------------------------------------------------------------
     9. KEYBOARD NAVIGATION (Left / Right arrow keys)
  ------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    }
  });

  /* -------------------------------------------------------------
     10. TOUCH / SWIPE SUPPORT
  ------------------------------------------------------------- */
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50; // minimum horizontal distance, in px

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    pauseAutoplay();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only treat as a swipe if the horizontal movement dominates,
    // so vertical scrolling on mobile isn't hijacked.
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextSlide(); // swiped left -> next car
      } else {
        prevSlide(); // swiped right -> previous car
      }
    }

    resumeAutoplay();
  }, { passive: true });

  /* -------------------------------------------------------------
     11. INITIAL STATE
        Kick off the entrance animations and progress bar for the
        first slide once the page has settled.
  ------------------------------------------------------------- */
  function init() {
    const first = slides[current];
    const accent = first.dataset.accent || '#d4af6a';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${hexToRgbString(accent)}, 0.35)`);

    requestAnimationFrame(() => {
      first.querySelector('.info-panel').classList.add('reveal');
      first.querySelector('.slide__image-wrap').classList.add('reveal');
      restartProgressBar();
    });
  }

  init();
})();
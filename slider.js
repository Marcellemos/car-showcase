/**
 * slider.js — LEMOS Car Showcase
 *
 * Responsabilidades deste módulo:
 *  1. Gerar o HTML das slides, dots e thumbnails a partir de `cars.js`
 *  2. Gerenciar o estado do slider (slide atual, pausa)
 *  3. Coordenar transições entre slides delegando para helpers coesos
 *  4. Registrar todos os event listeners (teclado, touch, mouse, botões)
 */

import { cars } from './cars.js';

(() => {
  'use strict';

  /* -------------------------------------------------------------------
     1. CONFIGURAÇÃO
     O tempo de autoplay é lido diretamente da variável CSS para que
     exista uma única fonte de verdade — não duplique aqui.
  ------------------------------------------------------------------- */
  const AUTOPLAY_MS = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--autoplay-duration'),
    10,
  );

  const SWIPE_THRESHOLD = 50; // px mínimos para reconhecer swipe horizontal

  /* -------------------------------------------------------------------
     2. ESTADO CENTRALIZADO
     Todo estado mutável do slider vive aqui. Nenhuma variável solta.
  ------------------------------------------------------------------- */
  const state = {
    current:        0,
    total:          cars.length,
    isPaused:       false,
    touchStartX:    0,
    touchStartY:    0,
    pauseSource:    null, // 'hover' | 'focus' | 'touch' | null
  };

  /* -------------------------------------------------------------------
     3. SELEÇÃO DE DOM COM GUARD CLAUSE
     Lança erro imediatamente se um elemento obrigatório estiver ausente,
     em vez de falhar silenciosamente mais adiante.
  ------------------------------------------------------------------- */

  /**
   * Retorna o elemento com o ID fornecido.
   * @throws {Error} se o elemento não existir no documento.
   */
  function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`[Slider] Elemento obrigatório não encontrado: #${id}`);
    return el;
  }

  const slider       = getRequiredElement('slider');
  const slidesTrack  = getRequiredElement('slidesTrack');
  const prevBtn      = getRequiredElement('prevBtn');
  const nextBtn      = getRequiredElement('nextBtn');
  const progressFill = getRequiredElement('progressFill');
  const pagination   = getRequiredElement('pagination');
  const thumbnails   = getRequiredElement('thumbnails');
  const counterEl    = getRequiredElement('counterCurrent');

  /* -------------------------------------------------------------------
     4. GERAÇÃO DE HTML A PARTIR DOS DADOS
     Adicionar ou remover um carro requer edição apenas em `cars.js`.
  ------------------------------------------------------------------- */

  /** Cria o markup de uma slide completa. */
  function createSlideHTML(car, index, total) {
    const isFirst  = index === 0;
    const position = `${index + 1} of ${total}`;

    return `
      <section
        class="slide ${isFirst ? 'active' : ''}"
        data-index="${index}"
        data-accent="${car.accent}"
        aria-roledescription="slide"
        aria-label="${position}: ${car.model}"
        role="group"
      >
        <div class="slide__bg">
          <img src="${car.image}" alt="" aria-hidden="true">
        </div>
        <div class="slide__overlay"></div>
        <div class="slide__gradient-sweep" aria-hidden="true"></div>

        <div class="slide__image-wrap">
          <img class="slide__image" src="${car.image}" alt="${car.brand} ${car.model}">
          <div class="slide__image-glow" aria-hidden="true"></div>
        </div>

        <div class="slide__content">
          <div class="info-panel">
            <p class="info-panel__eyebrow">${car.brand}</p>
            <h2 class="info-panel__title">${car.model}</h2>
            <p class="info-panel__desc">${car.desc}</p>

            <ul class="info-panel__specs">
              <li class="spec">
                <span class="spec__value">${car.specs.price}</span>
                <span class="spec__label">Preço</span>
              </li>
              <li class="spec">
                <span class="spec__value">${car.specs.power}</span>
                <span class="spec__label">Potência</span>
              </li>
              <li class="spec">
                <span class="spec__value">${car.specs.sprint}</span>
                <span class="spec__label">0–100 km/h</span>
              </li>
              <li class="spec">
                <span class="spec__value">${car.specs.top}</span>
                <span class="spec__label">Top Speed</span>
              </li>
            </ul>

            <div class="info-panel__cta">
              <button class="btn btn--primary">Monte o seu</button>
              <button class="btn btn--ghost">Veja mais</button>
            </div>
          </div>
        </div>
      </section>
    `.trim();
  }

  /** Cria o markup de um dot de paginação. */
  function createDotHTML(index, isActive) {
    return `
      <button
        class="pagination__dot ${isActive ? 'active' : ''}"
        role="tab"
        aria-selected="${isActive}"
        aria-label="Ir para slide ${index + 1}"
        data-index="${index}"
      ></button>
    `.trim();
  }

  /** Cria o markup de um thumbnail. */
  function createThumbHTML(car, index, isActive) {
    return `
      <button
        class="thumb ${isActive ? 'active' : ''}"
        data-index="${index}"
        aria-label="${car.model}"
        ${isActive ? 'aria-current="true"' : ''}
      >
        <img src="${car.image}" alt="" loading="lazy">
        <span class="thumb__label">${car.model}</span>
      </button>
    `.trim();
  }

  /** Renderiza slides, dots e thumbnails no DOM. */
  function renderSlider() {
    const total = state.total;

    slidesTrack.innerHTML = cars
      .map((car, i) => createSlideHTML(car, i, total))
      .join('');

    pagination.innerHTML = cars
      .map((_, i) => createDotHTML(i, i === 0))
      .join('');

    thumbnails.innerHTML = cars
      .map((car, i) => createThumbHTML(car, i, i === 0))
      .join('');

    counterEl.closest('.counter')
      ?.querySelector('.counter__total')
      ?.setAttribute('data-total', String(total).padStart(2, '0'));

    // Atualiza o total estático no HTML (caso exista como texto)
    const totalEl = document.querySelector('.counter__total');
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');
  }

  /* -------------------------------------------------------------------
     5. REFERÊNCIAS DINÂMICAS
     Obtidas após renderSlider() para refletir o DOM atualizado.
  ------------------------------------------------------------------- */
  function getSlides() {
    return Array.from(slidesTrack.querySelectorAll('.slide'));
  }

  function getDots() {
    return Array.from(pagination.querySelectorAll('.pagination__dot'));
  }

  function getThumbs() {
    return Array.from(thumbnails.querySelectorAll('.thumb'));
  }

  /* -------------------------------------------------------------------
     6. UTILITÁRIOS
  ------------------------------------------------------------------- */

  /**
   * Normaliza um índice para o intervalo [0, total), permitindo
   * navegação circular em ambas as direções.
   */
  function normalizeIndex(index) {
    return ((index % state.total) + state.total) % state.total;
  }

  /**
   * Converte hex "#rrggbb" (ou shorthand "#rgb") para "r, g, b".
   * Suporta hex de 3 e 6 dígitos; ignora canal alpha se presente.
   */
  function hexToRgb(hex) {
    const sanitized = hex
      .replace('#', '')
      .replace(/^([a-f\d])([a-f\d])([a-f\d])$/i, '$1$1$2$2$3$3')
      .substring(0, 6); // descarta alpha se hex tiver 8 dígitos

    const [r, g, b] = sanitized.match(/.{2}/g).map(v => parseInt(v, 16));
    return `${r}, ${g}, ${b}`;
  }

  /**
   * Remove uma classe de um elemento, força reflow para reiniciar
   * a animação CSS correspondente e re-adiciona a classe.
   *
   * Nota: `void el.offsetWidth` é o mecanismo padrão de reflow sync.
   * Evite chamadas consecutivas sem agrupar leituras antes das escritas
   * para não gerar layout thrashing.
   */
  function restartAnimation(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth; // força reflow — necessário para reiniciar @keyframes
    el.classList.add(className);
  }

  /* -------------------------------------------------------------------
     7. ATUALIZAÇÃO DE TEMA POR SLIDE
  ------------------------------------------------------------------- */

  /** Aplica a cor de destaque do slide às variáveis CSS globais. */
  function applyAccentTheme(accent) {
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', `rgba(${hexToRgb(accent)}, 0.35)`);
  }

  /* -------------------------------------------------------------------
     8. ANIMAÇÕES DE TRANSIÇÃO
  ------------------------------------------------------------------- */

  /** Desativa um slide e remove suas animações de entrada. */
  function deactivateSlide(slide) {
    slide.classList.remove('active');
    slide.querySelector('.info-panel')?.classList.remove('reveal');
    slide.querySelector('.slide__image-wrap')?.classList.remove('reveal');
  }

  /** Ativa um slide e (re)dispara suas animações de entrada. */
  function activateSlide(slide) {
    slide.classList.add('active');

    // rAF garante que .active (e sua transição de opacidade) já iniciou
    // antes das animações filhas dispararem, criando o beat cinematográfico.
    requestAnimationFrame(() => {
      restartAnimation(slide.querySelector('.info-panel'), 'reveal');
      restartAnimation(slide.querySelector('.slide__image-wrap'), 'reveal');
    });
  }

  /* -------------------------------------------------------------------
     9. SINCRONIZAÇÃO DE CONTROLES DE UI
  ------------------------------------------------------------------- */

  /** Atualiza os dots de paginação para refletir o índice atual. */
  function syncDots(activeIndex) {
    getDots().forEach((dot, i) => {
      const isActive = i === activeIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  }

  /** Atualiza os thumbnails e faz scroll suave para o ativo. */
  function syncThumbnails(activeIndex) {
    getThumbs().forEach((thumb, i) => {
      const isActive = i === activeIndex;
      thumb.classList.toggle('active', isActive);

      if (isActive) {
        thumb.setAttribute('aria-current', 'true');
        thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        thumb.removeAttribute('aria-current');
      }
    });
  }

  /** Atualiza o contador numérico de slide. */
  function syncCounter(activeIndex) {
    counterEl.textContent = String(activeIndex + 1).padStart(2, '0');
  }

  /** Reinicia a barra de progresso do autoplay. */
  function restartProgressBar() {
    restartAnimation(progressFill, 'running');
  }

  /* -------------------------------------------------------------------
     10. TRANSIÇÃO PRINCIPAL — ponto central de toda mudança de slide
         Cada responsabilidade é delegada a uma função coesa.
  ------------------------------------------------------------------- */

  /**
   * Navega para o slide no índice fornecido.
   * Índices fora do intervalo são normalizados (navegação circular).
   * Chamadas para o slide já ativo são ignoradas.
   */
  function goToSlide(index) {
    const nextIndex = normalizeIndex(index);
    if (nextIndex === state.current) return;

    const slides = getSlides();
    deactivateSlide(slides[state.current]);
    activateSlide(slides[nextIndex]);

    applyAccentTheme(cars[nextIndex].accent);
    syncDots(nextIndex);
    syncThumbnails(nextIndex);
    syncCounter(nextIndex);
    restartProgressBar();

    state.current = nextIndex;
  }

  const nextSlide = () => goToSlide(state.current + 1);
  const prevSlide = () => goToSlide(state.current - 1);

  /* -------------------------------------------------------------------
     11. AUTOPLAY — baseado no evento animationend da progress bar.
         A pausa é gerenciada via CSS (animation-play-state) através
         da classe `.is-paused` no slider. O bar "congela" visualmente
         e retoma do mesmo ponto quando desbloqueado.
  ------------------------------------------------------------------- */

  /**
   * Pausa o autoplay indicando a origem da pausa.
   * Múltiplas origens (hover + focus, por ex.) coexistem sem conflito.
   */
  function pauseAutoplay(source) {
    state.isPaused   = true;
    state.pauseSource = source;
    slider.classList.add('is-paused');
  }

  /**
   * Retoma o autoplay apenas se a origem que está retomando é a mesma
   * que havia pausado — evita que touchend cancele um pause de hover.
   */
  function resumeAutoplay(source) {
    if (state.pauseSource !== source) return;
    state.isPaused    = false;
    state.pauseSource = null;
    slider.classList.remove('is-paused');
  }

  progressFill.addEventListener('animationend', (e) => {
    if (e.animationName !== 'progressFill') return;
    if (state.isPaused) return;
    nextSlide();
  });

  /* -------------------------------------------------------------------
     12. EVENT LISTENERS

         Botões de navegação
  ------------------------------------------------------------------- */
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  // Ripple: posiciona o gradiente radial do ::after no ponto do cursor.
  slider.querySelectorAll('.btn, .nav-btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const { left, top, width, height } = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${((e.clientX - left) / width)  * 100}%`);
      btn.style.setProperty('--my', `${((e.clientY - top)  / height) * 100}%`);
    });
  });

  /* -------------------------------------------------------------------
         Dots e thumbnails (delegação de evento no container)
  ------------------------------------------------------------------- */
  pagination.addEventListener('click', (e) => {
    const dot = e.target.closest('.pagination__dot');
    if (dot) goToSlide(Number(dot.dataset.index));
  });

  thumbnails.addEventListener('click', (e) => {
    const thumb = e.target.closest('.thumb');
    if (thumb) goToSlide(Number(thumb.dataset.index));
  });

  /* -------------------------------------------------------------------
         Pausa por hover de mouse
  ------------------------------------------------------------------- */
  slider.addEventListener('mouseenter', () => pauseAutoplay('hover'));
  slider.addEventListener('mouseleave', () => resumeAutoplay('hover'));

  /* -------------------------------------------------------------------
         Pausa por foco de teclado (acessibilidade)
  ------------------------------------------------------------------- */
  slider.addEventListener('focusin',  () => pauseAutoplay('focus'));
  slider.addEventListener('focusout', () => resumeAutoplay('focus'));

  /* -------------------------------------------------------------------
         Teclado — somente quando o foco não está em campo de input
  ------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    }
  });

  /* -------------------------------------------------------------------
         Touch / swipe — horizontal domina para evitar sequestro de scroll
  ------------------------------------------------------------------- */
  slider.addEventListener('touchstart', (e) => {
    state.touchStartX = e.changedTouches[0].clientX;
    state.touchStartY = e.changedTouches[0].clientY;
    pauseAutoplay('touch');
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - state.touchStartX;
    const deltaY = e.changedTouches[0].clientY - state.touchStartY;
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD
                           && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      deltaX < 0 ? nextSlide() : prevSlide();
    }

    resumeAutoplay('touch');
  }, { passive: true });

  /* -------------------------------------------------------------------
     13. INICIALIZAÇÃO
  ------------------------------------------------------------------- */

  /** Configura o estado inicial do primeiro slide e dispara o autoplay. */
  function init() {
    renderSlider();

    const firstSlide = getSlides()[0];
    if (!firstSlide) throw new Error('[Slider] Nenhum slide encontrado após renderização.');

    applyAccentTheme(cars[0].accent);

    requestAnimationFrame(() => {
      firstSlide.querySelector('.info-panel')?.classList.add('reveal');
      firstSlide.querySelector('.slide__image-wrap')?.classList.add('reveal');
      restartProgressBar();
    });

    // Registra listeners de ripple nos botões gerados dinamicamente
    slider.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const { left, top, width, height } = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${((e.clientX - left) / width)  * 100}%`);
        btn.style.setProperty('--my', `${((e.clientY - top)  / height) * 100}%`);
      });
    });
  }

  init();

})();
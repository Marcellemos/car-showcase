import { cars } from './cars.js';

(() => {
  'use strict';

  /* 1. CONFIGURAÇÃO */
  const AUTOPLAY_MS = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--autoplay-duration'),
    10,
  );

  const SWIPE_THRESHOLD = 50; 

  /* 2. ESTADO CENTRALIZADO */
  const state = {
    current:        0,
    total:          cars.length,
    isPaused:       false,
    touchStartX:    0,
    touchStartY:    0,
    pauseSource:    null, 
  };

  /* 3. SELEÇÃO DE DOM COM GUARD CLAUSE */
    @throws {Error} 
   
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

  /* 4. GERAÇÃO DE HTML A PARTIR DOS DADOS */
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
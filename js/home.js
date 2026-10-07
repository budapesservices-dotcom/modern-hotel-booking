(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');


const hero = document.querySelector('[data-hero]');
  const heroScenes = document.querySelector('[data-hero-scenes]');
  const timeTrack = document.querySelector('[data-time-track]');
  const sceneLabel = document.querySelector('[data-live-label]');
  const heroDescription = document.querySelector('[data-hero-description]');
  const heroTimeline = Array.isArray(window.HERO_TIMELINE) ? window.HERO_TIMELINE : [];
  let scenes = [];
  let stops = [];
  let activeScene = 0;
  let timer = null;

  const renderHeroTimeline = () => {
    if (!heroScenes || !timeTrack || !heroTimeline.length) return;

    heroScenes.innerHTML = heroTimeline.map((item, index) => {
      const image = String(item.image || '').replace(/"/g, '&quot;');
      const mobileImage = image.startsWith('assets/images/remote/')
        ? image.replace(/-w\d+-q\d+(\.jpg)$/i, '-w760-q78$1')
        : image
          .replace(/([?&])w=\d+/i, '$1w=760')
          .replace(/([?&])q=\d+/i, '$1q=78');
      const loading = index === 0 ? 'eager' : 'lazy';
      const priority = index === 0 ? 'high' : 'low';
      return `<div class="hero-scene${index === 0 ? ' is-active' : ''}" data-scene="${index}">
        <img src="${image}" srcset="${mobileImage} 760w, ${image} 1400w" sizes="100vw" alt="" loading="${loading}" decoding="async" fetchpriority="${priority}">
      </div>`;
    }).join('');

    timeTrack.innerHTML = heroTimeline.map((item, index) =>
      `<button class="time-stop${index === 0 ? ' is-active' : ''}" type="button" data-scene-target="${index}" aria-label="${item.time} — ${item.caption}">
        <span>${item.time}</span><small>${item.caption}</small>
      </button>`
    ).join('');

    scenes = [...heroScenes.querySelectorAll('[data-scene]')];
    stops = [...timeTrack.querySelectorAll('[data-scene-target]')];
  };

  const setScene = (index, restart = true) => {
    if (!scenes.length) return;
    activeScene = (index + scenes.length) % scenes.length;

    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === activeScene));
    stops.forEach((stop, i) => stop.classList.toggle('is-active', i === activeScene));

    const meta = heroTimeline[activeScene];
    if (hero) hero.dataset.tone = meta.tone;
    if (header) header.dataset.tone = meta.tone;
    if (sceneLabel) sceneLabel.textContent = meta.label;
    if (heroDescription && meta.description) {
      heroDescription.textContent = meta.description;
    }

    const finalCall = document.querySelector('[data-final-call]');
    if (finalCall) {
      finalCall.style.setProperty('--final-image', `url('${meta.image}')`);
    }

    // Load only the next scene ahead of time so the initial page render
    // does not eagerly download the entire hero sequence.
    const nextScene = scenes[(activeScene + 1) % scenes.length];
    const nextImage = nextScene?.querySelector('img');
    if (nextImage) {
      nextImage.loading = 'eager';
      nextImage.fetchPriority = 'low';
    }

    if (restart) startTimer();
  };

  const startTimer = () => {
    if (!scenes.length || reduceMotion) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => setScene(activeScene + 1), 3600);
  };

  renderHeroTimeline();

  if (scenes.length) {
    stops.forEach(stop => {
      stop.addEventListener('click', () => setScene(Number(stop.dataset.sceneTarget)));
    });
    setScene(0, true);
  }

  // Keep the hero moving continuously; a pointer hovering the hero must never freeze the loop.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startTimer();
  });

  // Re-trigger the hero hairline whenever the hero section re-enters the viewport.
  if (hero && header && 'IntersectionObserver' in window) {
    const heroVisibility = new IntersectionObserver(([entry]) => {
      header.classList.toggle('hero-visible', entry.isIntersecting);
    }, { threshold: 0.12 });
    heroVisibility.observe(hero);
  } else {
    header?.classList.add('hero-visible');
  }

// ---------- Hotel Experience continuous flow ----------
  const experience = document.querySelector('[data-experience-carousel]');
  if (experience) {
    const track = experience.querySelector('[data-experience-track]');
    const originals = [...experience.querySelectorAll('[data-experience-card]')];
    const current = experience.querySelector('[data-experience-current]');

    if (track && originals.length > 1 && !reduceMotion) {
      // Duplicate one complete sequence. The moving track can then wrap by
      // exactly one sequence width with no visible jump.
      originals.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.add('experience-card-clone');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

      let raf = 0;
      let lastTime = 0;
      let position = 0;
      let loopWidth = 0;
      let cardStep = 0;
      const speed = () => window.matchMedia('(max-width:599px)').matches ? 45 : 50;

      const measure = () => {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const widths = originals.reduce((sum, card) => sum + card.getBoundingClientRect().width, 0);
        loopWidth = widths + (gap * originals.length);
        cardStep = (originals[0]?.getBoundingClientRect().width || 0) + gap;
      };

      const render = () => {
        track.style.transform = `translate3d(-${position}px,0,0)`;
        if (current && cardStep) {
          const active = Math.floor(position / cardStep) % originals.length;
          current.textContent = String(active + 1).padStart(2, '0');
        }
      };

      const frame = time => {
        if (document.hidden) {
          lastTime = 0;
          raf = 0;
          return;
        }

        if (!lastTime) lastTime = time;
        const delta = Math.min(time - lastTime, 50);
        lastTime = time;

        position += speed() * (delta / 1000);

        if (loopWidth && position >= loopWidth) {
          position -= loopWidth;
        }

        render();
        raf = window.requestAnimationFrame(frame);
      };

      const startFlow = () => {
        window.cancelAnimationFrame(raf);
        lastTime = 0;
        raf = window.requestAnimationFrame(frame);
      };

      const stopFlow = () => {
        window.cancelAnimationFrame(raf);
        raf = 0;
        lastTime = 0;
      };

      measure();
      render();
      startFlow();

      window.addEventListener('resize', () => {
        measure();
        if (loopWidth) position %= loopWidth;
        render();
      }, { passive:true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopFlow();
        } else {
          measure();
          if (loopWidth) position %= loopWidth;
          startFlow();
        }
      });
    }
  }
})();

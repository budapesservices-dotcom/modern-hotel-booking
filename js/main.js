(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const drawer = document.querySelector('[data-booking-drawer]');
  const summary = document.querySelector('[data-booking-summary]');
  const checkin = document.querySelector('[data-booking-checkin]');
  const checkout = document.querySelector('[data-booking-checkout]');
  const guests = document.querySelector('[data-booking-guests]');
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = document.querySelector('[data-lightbox-image]');
  const lightboxCaption = document.querySelector('[data-lightbox-caption]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pad = n => String(n).padStart(2, '0');

  // ---------- Header ----------
  const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 32);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  // ---------- Signature hero: time is the interface ----------
  const hero = document.querySelector('[data-hero]');
  const heroScenes = document.querySelector('[data-hero-scenes]');
  const timeTrack = document.querySelector('[data-time-track]');
  const sceneLabel = document.querySelector('[data-live-label]');
  const heroTimeline = Array.isArray(window.HERO_TIMELINE) ? window.HERO_TIMELINE : [];
  let scenes = [];
  let stops = [];
  let activeScene = 0;
  let timer = null;

  const renderHeroTimeline = () => {
    if (!heroScenes || !timeTrack || !heroTimeline.length) return;

    heroScenes.innerHTML = heroTimeline.map((item, index) => {
      const image = String(item.image || '').replace(/"/g, '&quot;');
      return `<div class="hero-scene${index === 0 ? ' is-active' : ''}" data-scene="${index}" style="--hero-image:url('${image}')"></div>`;
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
    hero?.addEventListener('mouseenter', () => window.clearTimeout(timer));
    hero?.addEventListener('mouseleave', startTimer);
    setScene(0, true);
  }

  // Re-trigger the hero hairline whenever the hero section re-enters the viewport.
  if (hero && header && 'IntersectionObserver' in window) {
    const heroVisibility = new IntersectionObserver(([entry]) => {
      header.classList.toggle('hero-visible', entry.isIntersecting);
    }, { threshold: 0.12 });
    heroVisibility.observe(hero);
  } else {
    header?.classList.add('hero-visible');
  }

  // ---------- Time story ----------
  const storyTime = document.querySelector('[data-story-time]');
  const storyKicker = document.querySelector('[data-story-kicker]');
  const storyTitle = document.querySelector('[data-story-title]');
  const storyBody = document.querySelector('[data-story-body]');
  const storyProgress = document.querySelector('[data-story-progress]');
  const storyPhotos = [...document.querySelectorAll('[data-story-photo]')];
  const storyData = [
    {
      time: '06:42',
      kicker: 'First light',
      title: 'Coffee.<br>Window.<br><em>No plans.</em>',
      body: 'Soft light enters before the city becomes loud. This is the hour we designed the room around.',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=84'
    },
    {
      time: '12:30',
      kicker: 'Nowhere to be',
      title: 'Keep the<br><em>afternoon.</em>',
      body: 'Close the door. Let the city get on without you. Some of the best hours arrive unannounced.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=84'
    },
    {
      time: '18:47',
      kicker: 'Blue hour',
      title: 'The city<br>changes<br><em>colour.</em>',
      body: 'Come downstairs when the windows turn gold. Stay for one more conversation before the night begins.',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1800&q=84'
    },
    {
      time: '22:16',
      kicker: 'Goodnight',
      title: 'Stay a<br>little<br><em>longer.</em>',
      body: 'Lights low. Curtains closed. Nothing left to do except enjoy the room you chose.',
      image: 'https://images.unsplash.com/photo-1551887373-6a4f699f0f3c?auto=format&fit=crop&w=1800&q=84'
    }
  ];

  const setStory = index => {
    if (!storyTime) return;
    const item = storyData[index];
    storyTime.textContent = item.time;
    if (storyKicker) storyKicker.textContent = item.kicker;
    if (storyTitle) storyTitle.innerHTML = item.title;
    if (storyBody) storyBody.textContent = item.body;
    if (storyProgress) storyProgress.style.width = `${((index + 1) / storyData.length) * 100}%`;
    storyPhotos.forEach(photo => photo.classList.remove('is-active'));
    const photo = storyPhotos[index % Math.max(storyPhotos.length, 1)];
    if (photo) {
      photo.style.backgroundImage = `url('${item.image}')`;
      requestAnimationFrame(() => photo.classList.add('is-active'));
    }
  };

  if (storyTime) {
    setStory(0);
    stops.forEach(stop => stop.addEventListener('click', () => setStory(Number(stop.dataset.sceneTarget))));
    if (!reduceMotion) {
      const storySection = document.querySelector('.time-story');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
      }, { threshold: 0.25 });
      storySection && observer.observe(storySection);
    }
  }

  // ---------- Booking ----------
  const setBookingMinDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    if (checkin && !checkin.min) checkin.min = iso;
    if (checkout && !checkout.min) checkout.min = iso;
  };
  setBookingMinDate();

  const updateSummary = () => {
    if (!summary) return;
    if (!checkin?.value || !checkout?.value) {
      summary.textContent = 'Choose your dates.';
      return;
    }
    const start = new Date(`${checkin.value}T12:00:00`);
    const end = new Date(`${checkout.value}T12:00:00`);
    const nights = Math.max(0, Math.round((end - start) / 86400000));
    summary.textContent = nights > 0
      ? `${nights} night${nights === 1 ? '' : 's'} / ${guests?.value || '2'} guests`
      : 'Choose a later check-out date.';
  };
  checkin?.addEventListener('change', () => {
    if (checkout) checkout.min = checkin.value || checkout.min;
    updateSummary();
  });
  checkout?.addEventListener('change', updateSummary);
  guests?.addEventListener('change', updateSummary);

  const openBooking = () => {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    checkin?.focus();
  };
  const closeBooking = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
  };
  document.querySelectorAll('[data-booking-open]').forEach(btn => btn.addEventListener('click', openBooking));
  document.querySelectorAll('[data-booking-close]').forEach(btn => btn.addEventListener('click', closeBooking));

  document.querySelectorAll('[data-book-now]').forEach(btn => btn.addEventListener('click', () => {
    const guestCount = guests?.value || '2';
    const message = checkin?.value && checkout?.value
      ? `Hello, I'd like to check availability at The Still Hotel from ${checkin.value} to ${checkout.value} for ${guestCount} guest${guestCount === '1' ? '' : 's'}.`
      : `Hello, I'd like to ask about booking a room at The Still Hotel for ${guestCount} guest${guestCount === '1' ? '' : 's'}.`;
    window.open(`https://wa.me/6281200000000?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }));

  // ---------- Reveal / parallax ----------
  const reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.1 });
    reveal.forEach(el => revealObserver.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('is-visible'));
  }

  if (!reduceMotion && window.matchMedia('(min-width: 901px)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        document.querySelectorAll('[data-parallax]').forEach(el => {
          const rect = el.getBoundingClientRect();
          const speed = Number(el.dataset.parallax || 0.03);
          const shift = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
          el.style.transform = `translateY(${shift}px)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // ---------- Gallery lightbox ----------
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxImage) {
      lightboxImage.src = '';
      lightboxImage.alt = '';
    }
  };
  document.querySelectorAll('[data-lightbox-item]').forEach(item => item.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    const image = item.querySelector('img');
    const caption = item.querySelector('figcaption')?.textContent || '';
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }));
  document.querySelectorAll('[data-lightbox-close]').forEach(btn => btn.addEventListener('click', closeLightbox));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeBooking();
      closeLightbox();
    }
  });
})();
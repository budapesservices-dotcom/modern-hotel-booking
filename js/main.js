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

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    header?.classList.remove('menu-open');
    body.classList.remove('no-scroll');
  };

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    header?.classList.toggle('menu-open', open);
    body.classList.toggle('no-scroll', open);
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

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

    const finalCall = document.querySelector('[data-final-call]');
    if (finalCall) {
      finalCall.style.setProperty('--final-image', `url('${meta.image}')`);
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
      const speed = () => window.matchMedia('(max-width:599px)').matches ? 23 : 30;

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

  // ---------- Room Atlas filters ----------
  const roomFilter = document.querySelector('[data-room-filter]');
  if (roomFilter) {
    const roomItems = [...document.querySelectorAll('[data-room-item]')];
    const categoryTabs = [...roomFilter.querySelectorAll('[data-room-category]')];
    const capacityTabs = [...roomFilter.querySelectorAll('[data-room-capacity]')];
    const roomCount = roomFilter.querySelector('[data-room-result-count]');
    let activeCategory = 'all';
    let activeCapacity = 'all';

    const applyRoomFilters = () => {
      const visible = roomItems.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.dataset.category === activeCategory;
        const matchesCapacity = activeCapacity === 'all' || item.dataset.maxGuests === activeCapacity;
        return matchesCategory && matchesCapacity;
      });

      roomItems.forEach(item => {
        const show = visible.includes(item);
        item.classList.toggle('is-filter-hidden', !show);
        item.setAttribute('aria-hidden', show ? 'false' : 'true');
      });

      categoryTabs.forEach(tab => {
        const active = tab.dataset.roomCategory === activeCategory;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      capacityTabs.forEach(tab => {
        const active = tab.dataset.roomCapacity === activeCapacity;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      if (roomCount) roomCount.textContent = String(visible.length).padStart(2, '0');
    };

    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.roomCategory;
        applyRoomFilters();
      });
    });

    capacityTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeCapacity = tab.dataset.roomCapacity;
        applyRoomFilters();
      });
    });

    applyRoomFilters();
  }

  // ---------- Room details ----------
  const roomDetailDrawer = document.querySelector('[data-room-detail-drawer]');
  const roomDetailTitle = document.querySelector('[data-room-detail-title]');
  const roomDetailKicker = document.querySelector('[data-room-detail-kicker]');
  const roomDetailDescription = document.querySelector('[data-room-detail-description]');
  const roomDetailSpecs = document.querySelector('[data-room-detail-specs]');
  const roomDetailAvailability = document.querySelector('[data-room-detail-availability]');
  const roomDetailPrice = document.querySelector('[data-room-detail-price]');
  const openRoomDetail = item => {
    if (!roomDetailDrawer) return;
    const title = item.querySelector('.room-dir-main h3')?.textContent || '';
    const description = item.querySelector('.room-dir-main p')?.textContent || '';
    const type = item.querySelector('.room-dir-class span')?.textContent || '';
    const size = item.querySelector('.room-dir-class i')?.textContent || '';
    const availability = item.querySelector('.room-dir-availability')?.textContent || '';
    const price = item.querySelector('[data-room-price-current]')?.textContent || '';
    const specs = [...item.querySelectorAll('.room-dir-main>div span')].map(el => el.textContent.trim());

    if (roomDetailTitle) roomDetailTitle.textContent = title;
    if (roomDetailKicker) roomDetailKicker.textContent = `${type} · ${size}`;
    if (roomDetailDescription) roomDetailDescription.textContent = description;
    if (roomDetailSpecs) roomDetailSpecs.innerHTML = specs.map(spec => `<span>${spec}</span>`).join('');
    if (roomDetailAvailability) roomDetailAvailability.textContent = availability;
    if (roomDetailPrice) roomDetailPrice.textContent = price;

    roomDetailDrawer.classList.add('open');
    roomDetailDrawer.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
  };
  const closeRoomDetail = () => {
    if (!roomDetailDrawer) return;
    roomDetailDrawer.classList.remove('open');
    roomDetailDrawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
  };
  document.querySelectorAll('[data-room-detail]').forEach(btn => {
    btn.addEventListener('click', () => openRoomDetail(btn.closest('[data-room-item]')));
  });
  document.querySelectorAll('[data-room-detail-close]').forEach(btn => btn.addEventListener('click', closeRoomDetail));

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
    closeRoomDetail();
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
      closeRoomDetail();
    }
  });
})();
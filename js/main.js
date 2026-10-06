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
  const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=84';

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
    if (heroDescription && meta.description) {
      heroDescription.textContent = meta.description;
    }

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
    let activeCategory = 'all';
    let activeCapacity = 'all';

    const applyRoomFilters = () => {
      roomItems.forEach(item => {
        const itemCategory = String(item.dataset.category || '').trim().toLowerCase();
        const itemCapacity = String(item.dataset.maxGuests || '').trim();

        const matchesCategory =
          activeCategory === 'all' ||
          itemCategory === activeCategory;

        const requestedCapacity = activeCapacity === 'all' ? null : Number(activeCapacity);
        const roomCapacity = Number(itemCapacity);

        const matchesCapacity =
          requestedCapacity === null ||
          (Number.isFinite(roomCapacity) &&
           Number.isFinite(requestedCapacity) &&
           roomCapacity >= requestedCapacity);

        const show = matchesCategory && matchesCapacity;

        // Use an explicit display state as well as the hidden attribute.
        // This keeps the filter reliable across the responsive grid rules.
        item.hidden = !show;
        item.style.display = show ? '' : 'none';
        item.classList.toggle('is-filter-hidden', !show);
        item.setAttribute('aria-hidden', show ? 'false' : 'true');
      });

      categoryTabs.forEach(tab => {
        const active =
          String(tab.dataset.roomCategory || 'all').trim().toLowerCase() === activeCategory;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      capacityTabs.forEach(tab => {
        const active =
          String(tab.dataset.roomCapacity || 'all').trim() === activeCapacity;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    categoryTabs.forEach(tab => {
      tab.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        activeCategory = String(tab.dataset.roomCategory || 'all').toLowerCase();
        applyRoomFilters();
      });
    });

    capacityTabs.forEach(tab => {
      tab.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        activeCapacity = String(tab.dataset.roomCapacity || 'all');
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
  const roomDetailTotal = document.querySelector('[data-room-detail-total]');
  const roomDetailNumber = document.querySelector('[data-room-detail-number]');
  const roomDetailSummaryRoom = document.querySelector('[data-room-detail-summary-room]');
  const roomDetailSummaryType = document.querySelector('[data-room-detail-summary-type]');
  const roomDetailMainImage = document.querySelector('[data-room-detail-main-image]');
  const roomDetailThumbs = document.querySelector('[data-room-detail-thumbs]');
  const roomDetailImageCurrent = document.querySelector('[data-room-detail-image-current]');
  const roomDetailCheckin = document.querySelector('[data-room-detail-checkin]');
  const roomDetailCheckout = document.querySelector('[data-room-detail-checkout]');
  const roomDetailGuests = document.querySelector('[data-room-detail-guests]');
  const roomDetailNights = document.querySelector('[data-room-detail-nights]');
  const roomDetailFacilities = document.querySelector('[data-room-detail-facilities]');
  const roomDetailFacilityCount = document.querySelector('[data-room-detail-facility-count]');
  let activeRoomName = '';

  const roomFacilities = {
    'quiet-room': ['King bed', 'Rain shower', 'Fast Wi-Fi', 'Smart TV', 'Climate control', 'Blackout curtains'],
    'city-room': ['King bed', 'City view', 'Rain shower', 'Fast Wi-Fi', 'Work desk', 'Espresso station', 'Smart TV'],
    'garden-room': ['King bed', 'Garden outlook', 'Rain shower', 'Fast Wi-Fi', 'Lounge chair', 'Espresso station', 'Premium bath amenities'],
    'long-room': ['King bed', 'Private lounge', 'Rain shower', 'Dedicated work nook', 'Espresso station', 'Mini bar', 'Fast Wi-Fi'],
    'corner-room': ['King bed', 'Panoramic outlook', 'Private lounge', 'Rain shower', 'Espresso station', 'Mini bar', 'Premium bath amenities'],
    'light-room': ['King bed', 'Floor-to-ceiling windows', 'Work nook', 'Rain shower', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Fast Wi-Fi'],
    'still-suite': ['King bed', 'Separate living space', 'Deep soaking tub', 'Dining nook', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Bathrobes & slippers'],
    'panorama-suite': ['King bed', 'Separate living space', 'Wide city views', 'Deep soaking tub', 'Dining area', 'Espresso station', 'Mini bar', 'Bathrobes & slippers', 'Premium bath amenities'],
    'residence-suite': ['King bed', 'Private lounge', 'Separate dining area', 'Deep soaking tub', 'Dedicated work desk', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Evening turndown'],
    'gathering-suite': ['King bed', 'Expansive living room', 'Dining lounge', 'Deep soaking tub', 'Dedicated work desk', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Evening turndown', 'Bathrobes & slippers'],
    'sixfold-residence': ['Two king beds', 'Full living room', 'Full dining area', 'Pantry station', 'Two-bathroom layout', 'Deep soaking tub', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Evening turndown', 'Bathrobes & slippers'],
    'courtyard-suite': ['Two king beds', 'Private terrace', 'Sheltered courtyard outlook', 'Deep soaking tub', 'Dining lounge', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Bathrobes & slippers', 'Evening turndown'],
    'grand-residence': ['Two king beds', 'Expansive living room', 'Full dining area', 'Private lounge', 'Deep soaking tub', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Evening turndown', 'Bathrobes & slippers'],
    'family-residence': ['Three king beds', 'Large living room', 'Full dining area', 'Pantry station', 'Two-bathroom layout', 'Deep soaking tub', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Evening turndown', 'Bathrobes & slippers'],
    'terrace-suite': ['Two king beds', 'Private terrace', 'Separate living space', 'Deep soaking tub', 'Dining lounge', 'Espresso station', 'Mini bar', 'Premium bath amenities', 'Bathrobes & slippers', 'Evening turndown']
  };

  const renderRoomFacilities = roomId => {
    if (!roomDetailFacilities) return;
    const facilities = roomFacilities[roomId] || [];
    roomDetailFacilities.innerHTML = facilities.map(item => '<li>' + item + '</li>').join('');
    if (roomDetailFacilityCount) roomDetailFacilityCount.textContent = String(facilities.length).padStart(2, '0');
  };

  // ---------- Custom room-summary dropdowns ----------
  const closeRoomCustomSelects = () => {
    document.querySelectorAll('[data-room-custom-select].is-open').forEach(root => {
      root.classList.remove('is-open');
      root.querySelector('[data-room-select-trigger]')?.setAttribute('aria-expanded', 'false');
    });
  };

  const refreshRoomCustomSelect = nativeSelect => {
    if (!nativeSelect) return;
    const root = nativeSelect.parentElement?.querySelector('[data-room-custom-select]');
    if (!root) return;
    const trigger = root.querySelector('[data-room-select-trigger]');
    const menu = root.querySelector('[data-room-select-menu]');
    if (!trigger || !menu) return;

    const selected = [...nativeSelect.options].find(option => option.value === nativeSelect.value);
    trigger.textContent = selected?.textContent?.trim() || nativeSelect.value || '—';

    menu.innerHTML = [...nativeSelect.options].map(option => {
      const selectedClass = option.selected ? ' is-selected' : '';
      const aria = option.selected ? 'true' : 'false';
      return '<button type="button" class="room-custom-option' + selectedClass +
        '" role="option" aria-selected="' + aria +
        '" data-room-custom-value="' + option.value + '">' +
        option.textContent + '</button>';
    }).join('');
  };

  const setupRoomCustomSelect = nativeSelect => {
    const root = nativeSelect?.parentElement?.querySelector('[data-room-custom-select]');
    if (!nativeSelect || !root || root.dataset.ready === 'true') return;

    const trigger = root.querySelector('[data-room-select-trigger]');
    const menu = root.querySelector('[data-room-select-menu]');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      const opening = !root.classList.contains('is-open');
      closeRoomCustomSelects();
      if (opening) {
        root.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    menu.addEventListener('click', event => {
      const option = event.target.closest('[data-room-custom-value]');
      if (!option) return;
      nativeSelect.value = option.dataset.roomCustomValue || nativeSelect.value;
      nativeSelect.dispatchEvent(new Event('change', { bubbles:true }));
      closeRoomCustomSelects();
    });

    root.dataset.ready = 'true';
    refreshRoomCustomSelect(nativeSelect);
  };

  const initRoomCustomSelects = () => {
    setupRoomCustomSelect(roomDetailGuests);
    setupRoomCustomSelect(roomDetailNights);
  };

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-room-custom-select]')) closeRoomCustomSelects();
  });


  const roomGallery = {
    "quiet-room": [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=84"
    ],
    "city-room": [
      "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=84"
    ],
    "garden-room": [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84"
    ],
    "long-room": [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=84"
    ],
    "corner-room": [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=84"
    ],
    "light-room": [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1200&q=84"
    ],
    "still-suite": [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=84"
    ],
    "panorama-suite": [
      "https://images.unsplash.com/photo-1551887373-6a4f699f0f3c?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=84"
    ],
    "residence-suite": [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=84"
    ],
    "gathering-suite": [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=84"
    ],
    "sixfold-residence": [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=84"
    ],
    "courtyard-suite": [
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=84"
    ],
    "grand-residence": [
      "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=84"
    ],
    "family-residence": [
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=84"
    ],
    "terrace-suite": [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=84"
    ]
  };

  const setRoomDetailDateMinimums = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const iso = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}`;
    if (roomDetailCheckin) {
      roomDetailCheckin.min = iso;
      if (!roomDetailCheckin.value) roomDetailCheckin.value = iso;
    }
    if (roomDetailCheckout) {
      roomDetailCheckout.min = iso;
      if (!roomDetailCheckout.value) roomDetailCheckout.value = tomorrowIso;
    }
  };


  const configureRoomDetailGuests = item => {
    if (!roomDetailGuests) return;
    const maxGuests = Math.max(1, Number(item?.dataset.maxGuests || 1));
    const current = Math.min(Math.max(1, Number(roomDetailGuests.value || 1)), maxGuests);
    roomDetailGuests.innerHTML = Array.from({ length:maxGuests }, (_, index) => {
      const value = index + 1;
      return '<option value="' + value + '"' + (value === current ? ' selected' : '') + '>' + value + '</option>';
    }).join('');
    refreshRoomCustomSelect(roomDetailGuests);
  };

  const setRoomDetailNights = nights => {
    if (!roomDetailNights) return;
    const value = Math.min(30, Math.max(1, Number(nights) || 1));
    roomDetailNights.value = String(value);
    refreshRoomCustomSelect(roomDetailNights);
  };

  const syncRoomDetailCheckoutFromNights = () => {
    if (!roomDetailCheckin || !roomDetailCheckout || !roomDetailNights) return;

    const nights = Math.min(30, Math.max(1, Number(roomDetailNights.value) || 1));
    const next = new Date(roomDetailCheckin.value + 'T12:00:00');
    next.setDate(next.getDate() + nights);

    roomDetailCheckout.min = roomDetailCheckin.value || roomDetailCheckout.min;
    roomDetailCheckout.value = next.toISOString().slice(0, 10);
  };

  const syncRoomDetailNightsFromDates = () => {
    if (!roomDetailCheckin || !roomDetailCheckout || !roomDetailNights) return;

    const startDate = new Date(roomDetailCheckin.value + 'T12:00:00');
    const endDate = new Date(roomDetailCheckout.value + 'T12:00:00');
    const diff = Math.round((endDate - startDate) / 86400000);

    if (diff >= 1 && diff <= 30) {
      roomDetailNights.value = String(diff);
      refreshRoomCustomSelect(roomDetailNights);
      return;
    }

    // Keep the user's selected dates. Only correct the minimum invalid case.
    if (diff < 1) {
      const next = new Date(startDate);
      next.setDate(next.getDate() + 1);
      roomDetailCheckout.value = next.toISOString().slice(0, 10);
      roomDetailNights.value = '1';
    } else {
      roomDetailNights.value = '30';
    }

    refreshRoomCustomSelect(roomDetailNights);
  };

  const updateRoomDetailSummary = () => {
    if (!roomDetailCheckin || !roomDetailCheckout) return;

    const startDate = new Date(roomDetailCheckin.value + 'T12:00:00');
    const endDate = new Date(roomDetailCheckout.value + 'T12:00:00');
    const dateNights = Math.round((endDate - startDate) / 86400000);
    const nights = Math.min(30, Math.max(1, dateNights || Number(roomDetailNights?.value) || 1));

    const priceText = roomDetailPrice?.textContent?.replace(/[^0-9.]/g, '') || '0';
    const price = Number(priceText) || 0;

    if (roomDetailNights) {
      roomDetailNights.value = String(nights);
      refreshRoomCustomSelect(roomDetailNights);
    }

    if (roomDetailTotal) {
      roomDetailTotal.textContent = String.fromCharCode(36) + (price * nights).toLocaleString('en-US');
    }

    if (roomDetailSummaryRoom) roomDetailSummaryRoom.textContent = activeRoomName || '—';
    if (roomDetailSummaryType && roomDetailKicker?.textContent) {
      roomDetailSummaryType.textContent = roomDetailKicker.textContent.split(' · ')[0] || '—';
    }
  };

  const renderRoomDetailGallery = (item, roomId) => {
    if (!roomDetailMainImage || !roomDetailThumbs) return;
    const first = item.querySelector('.room-dir-image img')?.src || '';
    const images = roomGallery[roomId]?.length ? roomGallery[roomId] : [first, first, first];
    let activeImage = 0;

    const renderMain = index => {
      activeImage = index;
      roomDetailMainImage.dataset.fallbackApplied = 'false';
      roomDetailMainImage.src = images[index] || IMAGE_FALLBACK;
      roomDetailMainImage.alt = item.querySelector('.room-dir-image img')?.alt || activeRoomName;
      if (roomDetailImageCurrent) roomDetailImageCurrent.textContent = String(index+1).padStart(2,'0');
      [...roomDetailThumbs.querySelectorAll('button')].forEach((btn,i) => btn.classList.toggle('is-active', i===index));
    };

    roomDetailMainImage.onerror = () => {
      if (roomDetailMainImage.dataset.fallbackApplied === 'true') return;
      roomDetailMainImage.dataset.fallbackApplied = 'true';
      roomDetailMainImage.src = IMAGE_FALLBACK;
    };

    roomDetailThumbs.innerHTML = images.map((src,index) => `<button type="button" class="room-detail-thumb${index===0 ? ' is-active' : ''}" aria-label="View room photo ${index+1}" data-room-detail-thumb data-index="${index}"><img src="${src || IMAGE_FALLBACK}" alt="" loading="lazy"></button>`).join('');

    roomDetailThumbs.querySelectorAll('img').forEach(img => {
      img.onerror = () => {
        if (img.dataset.fallbackApplied === 'true') return;
        img.dataset.fallbackApplied = 'true';
        img.src = IMAGE_FALLBACK;
      };
    });
    roomDetailThumbs.querySelectorAll('[data-room-detail-thumb]').forEach(btn => {
      btn.addEventListener('click', () => renderMain(Number(btn.dataset.index)));
    });
    renderMain(0);
  };

  const openRoomDetail = item => {
    if (!roomDetailDrawer) return;
    activeRoomName = item.querySelector('.room-dir-main h3')?.textContent || '';
    const roomId = item.id;
    const description = item.querySelector('.room-dir-main p')?.textContent || '';
    const type = item.querySelector('.room-dir-class span')?.textContent || '';
    const size = item.querySelector('.room-dir-class i')?.textContent || '';
    const availability = item.querySelector('.room-dir-availability')?.textContent || '';
    const price = item.querySelector('[data-room-price-current]')?.textContent || '';
    const specs = [...item.querySelectorAll('.room-dir-main>div span')].map(el => el.textContent.trim());

    if (roomDetailTitle) roomDetailTitle.textContent = activeRoomName;
    if (roomDetailKicker) roomDetailKicker.textContent = `${type} · ${size}`;
    if (roomDetailDescription) roomDetailDescription.textContent = description;
    if (roomDetailSpecs) roomDetailSpecs.innerHTML = specs.map(spec => `<span>${spec}</span>`).join('');
    if (roomDetailAvailability) roomDetailAvailability.textContent = availability;
    if (roomDetailPrice) roomDetailPrice.textContent = price;
    renderRoomFacilities(roomId);
    if (roomDetailSummaryRoom) roomDetailSummaryRoom.textContent = activeRoomName;
    if (roomDetailSummaryType) roomDetailSummaryType.textContent = type;
    if (roomDetailNumber) roomDetailNumber.textContent = '';
    initRoomCustomSelects();
    configureRoomDetailGuests(item);
    setRoomDetailDateMinimums();
    setRoomDetailNights(1);
    syncRoomDetailCheckoutFromNights();
    updateRoomDetailSummary();
    renderRoomDetailGallery(item, roomId);

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

  roomDetailCheckin?.addEventListener('change', () => {
    if (roomDetailCheckout) {
      roomDetailCheckout.min = roomDetailCheckin.value || roomDetailCheckout.min;

      const checkinDate = new Date(roomDetailCheckin.value + 'T12:00:00');
      const checkoutDate = new Date(roomDetailCheckout.value + 'T12:00:00');

      // Do not rewrite a valid checkout just because check-in changed.
      // Only move it to the next day when the existing checkout becomes invalid.
      if (!roomDetailCheckout.value || checkoutDate <= checkinDate) {
        const next = new Date(checkinDate);
        next.setDate(next.getDate() + 1);
        roomDetailCheckout.value = next.toISOString().slice(0, 10);
      }
    }

    syncRoomDetailNightsFromDates();
    updateRoomDetailSummary();
  });

  roomDetailCheckout?.addEventListener('change', () => {
    if (roomDetailCheckin && roomDetailCheckout.value <= roomDetailCheckin.value) {
      const next = new Date(roomDetailCheckin.value + 'T12:00:00');
      next.setDate(next.getDate() + 1);
      roomDetailCheckout.value = next.toISOString().slice(0, 10);
    }

    syncRoomDetailNightsFromDates();
    updateRoomDetailSummary();
  });

  roomDetailNights?.addEventListener('change', () => {
    syncRoomDetailCheckoutFromNights();
    refreshRoomCustomSelect(roomDetailNights);
    updateRoomDetailSummary();
  });

  roomDetailGuests?.addEventListener('change', () => {
    refreshRoomCustomSelect(roomDetailGuests);
    updateRoomDetailSummary();
  });

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

  window.addEventListener('still:booking-confirmed', () => {
    closeBooking();
    closeRoomDetail();
  });

  document.querySelectorAll('[data-book-now]').forEach(btn => btn.addEventListener('click', () => {
    window.TheStillBooking?.start({
      checkin: checkin?.value || '',
      checkout: checkout?.value || '',
      guests: guests?.value || '2'
    });
  }));

  document.querySelectorAll('[data-room-detail-booking-now]').forEach(btn => btn.addEventListener('click', () => {
    const price = roomDetailPrice?.textContent?.replace(/[^0-9.]/g, '') || '';
    window.TheStillBooking?.start({
      room: activeRoomName || '',
      checkin: roomDetailCheckin?.value || '',
      checkout: roomDetailCheckout?.value || '',
      guests: roomDetailGuests?.value || '2',
      price
    });
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

  // ---------- Moments gallery filter ----------
  const momentsFilter = document.querySelector('[data-moments-filter]');
  if (momentsFilter) {
    const momentItems = [...document.querySelectorAll('[data-moment-item]')];
    const momentTabs = [...momentsFilter.querySelectorAll('[data-moment-category]')];
    let activeMomentCategory = 'all';

    const applyMomentFilter = () => {
      momentItems.forEach(item => {
        const itemCategory = String(item.dataset.category || '').trim().toLowerCase();
        const show =
          activeMomentCategory === 'all' ||
          itemCategory === activeMomentCategory;

        item.hidden = !show;
        item.setAttribute('aria-hidden', show ? 'false' : 'true');
        item.classList.toggle('is-filter-hidden', !show);
      });

      momentTabs.forEach(tab => {
        const active =
          String(tab.dataset.momentCategory || 'all').trim().toLowerCase() === activeMomentCategory;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    momentTabs.forEach(tab => {
      tab.addEventListener('click', event => {
        event.preventDefault();
        activeMomentCategory = String(tab.dataset.momentCategory || 'all').trim().toLowerCase();
        applyMomentFilter();
      });
    });

    applyMomentFilter();
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
// Room booking controls refined.



/* =========================================================
   STILL HOTEL / AMBIENT MOTION FX
   Performance-tuned version:
   - no animated blur/filter
   - no blanket will-change layers
   - staggered reveal remains
   - parallax is limited to larger visual/content blocks
   - scroll work uses cached geometry instead of
     getBoundingClientRect() on every frame
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const motionSelectors = [
    '.site-header .brand',
    '.site-header .site-nav a',
    '.site-header .menu-toggle',
    'main h1',
    'main h2',
    'main h3',
    'main .eyebrow',
    'main p:not(.image-caption):not(.micro-copy):not(.contact-form-status)',
    'main li',
    'main label',
    'main input',
    'main textarea',
    'main select',
    'main .button',
    'main .text-link',
    'main figure',
    'main .room-image',
    'main .image-frame',
    'main .gallery-item',
    'main .call-hero-visual',
    'main .login-image',
    'main .contact-location-visual',
    'main .amenity-grid > div',
    'main .stat-grid > div',
    'main .room-specs',
    'main .price-box',
    'main .contact-card',
    'main .call-contact-item',
    'main .contact-form-field',
    'main .booking-empty-state',
    'main .your-booking-card',
    'footer .footer-logo',
    'footer .footer-motto',
    'footer .footer-socials a',
    'footer .footer-column',
    'footer .footer-bottom'
  ].join(',');

  const sheenSelectors = [
    'main .room-image',
    'main .image-frame',
    'main .gallery-item',
    'main .call-hero-visual',
    'main .login-image',
    'main .contact-location-visual'
  ].join(',');

  // Only larger elements receive the extra scroll drift. Text/form elements
  // still get staggered entrance timing without adding continuous work.
  const parallaxSelectors = [
    'main h1',
    'main h2',
    'main figure',
    'main .room-image',
    'main .image-frame',
    'main .gallery-item',
    'main .call-hero-visual',
    'main .login-image',
    'main .contact-location-visual',
    'main .amenity-grid > div',
    'main .stat-grid > div',
    'main .price-box',
    'main .contact-card',
    'main .call-contact-item',
    'main .booking-empty-state',
    'main .your-booking-card'
  ].join(',');

  const protectedSelectors = [
    '.reveal',
    '[data-parallax]',
    '[data-panel-speed]',
    '.story-architecture-figure',
    '.story-triptych-stage',
    '.story-pane',
    '.time-story',
    '[data-experience-carousel]',
    '[data-experience-carousel] *',
    '[data-suite-carousel]',
    '[data-suite-carousel] *',
    '[data-story-architecture]',
    '[data-story-architecture] *',
    '.booking-drawer',
    '.booking-drawer *',
    '.still-booking-modal',
    '.still-booking-modal *',
    '.lightbox',
    '.lightbox *'
  ].join(',');

  const prepared = new WeakSet();
  const parallaxElements = new Set();
  const geometry = new Map();

  const typeSettings = {
    'heading-major': { y:24, duration:980, delay:60 },
    'heading':       { y:21, duration:900, delay:35 },
    'copy':          { y:14, duration:780, delay:95 },
    'action':        { y:11, duration:690, delay:150 },
    'image':         { y:22, duration:930, delay:55 },
    'list':          { y:13, duration:740, delay:120 },
    'form':          { y:12, duration:700, delay:140 },
    'stat':          { y:17, duration:820, delay:80 },
    'block':         { y:17, duration:820, delay:75 }
  };

  const isProtected = element => {
    if (!element || !(element instanceof Element)) return true;
    if (element.matches(protectedSelectors)) return true;
    if (element.closest(protectedSelectors)) return true;
    if (element.hasAttribute('hidden')) return true;

    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden';
  };

  const getMotionType = element => {
    const tag = element.tagName.toLowerCase();
    if (tag === 'h1') return 'heading-major';
    if (tag === 'h2' || tag === 'h3') return 'heading';
    if (tag === 'p') return 'copy';
    if (tag === 'a' || tag === 'button') return 'action';
    if (tag === 'figure' || element.matches(sheenSelectors)) return 'image';
    if (tag === 'li') return 'list';
    if (tag === 'label' || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) return 'form';
    if (element.matches('.stat-grid > div')) return 'stat';
    return 'block';
  };

  const prepareElement = element => {
    if (prepared.has(element) || isProtected(element)) return;

    prepared.add(element);

    const type = getMotionType(element);
    const config = typeSettings[type] || typeSettings.block;
    const index = prepared.size || 0;

    const delay = config.delay + ((index * 47) % 360);
    const duration = config.duration + ((index * 29) % 220);
    const y = config.y + ((index * 3) % 7);
    const x = index % 3 === 1 ? -6 : (index % 3 === 2 ? 6 : 0);

    element.classList.add('fx-motion');
    element.style.setProperty('--fx-delay', delay + 'ms');
    element.style.setProperty('--fx-duration', duration + 'ms');
    element.style.setProperty('--fx-reveal-y', y + 'px');
    element.style.setProperty('--fx-x', x + 'px');

    if (element.matches(sheenSelectors)) {
      element.classList.add('fx-sheen');
    }

    if (element.matches(parallaxSelectors)) {
      element.style.setProperty('--fx-speed', '0.006');
      parallaxElements.add(element);
    }
  };

  const prepareWithin = root => {
    if (!(root instanceof Element)) return;
    if (root.matches(motionSelectors)) prepareElement(root);
    root.querySelectorAll(motionSelectors).forEach(prepareElement);
  };

  prepareWithin(document.documentElement);

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fx-motion').forEach(element => element.classList.add('fx-visible'));
  } else {
    const active = new Set();

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;

        if (entry.isIntersecting) {
          element.classList.add('fx-visible');
          active.add(element);
        } else {
          active.delete(element);
        }
      });
    }, {
      threshold:0.02,
      rootMargin:'14% 0px 14% 0px'
    });

    document.querySelectorAll('.fx-motion').forEach(element => revealObserver.observe(element));

    // Parallax candidates use the same viewport gating, but only a much
    // smaller visual subset is updated during scrolling.
    const parallaxActive = new Set();

    const parallaxObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;
        if (entry.isIntersecting) {
          parallaxActive.add(element);
        } else {
          parallaxActive.delete(element);
        }
      });
    }, {
      threshold:0,
      rootMargin:'18% 0px 18% 0px'
    });

    parallaxElements.forEach(element => parallaxObserver.observe(element));

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    let raf = 0;
    let lastScrollY = window.scrollY;
    let metricsDirty = true;

    const refreshGeometry = () => {
      geometry.clear();

      parallaxElements.forEach(element => {
        if (!element.isConnected) return;

        const rect = element.getBoundingClientRect();
        geometry.set(element, {
          top: rect.top + window.scrollY,
          height: rect.height,
          current: 0,
          target: 0
        });
      });

      metricsDirty = false;
    };

    const updateParallax = () => {
      raf = 0;

      if (document.hidden) return;

      if (metricsDirty) refreshGeometry();

      const scrollY = window.scrollY;
      const viewportCenter = scrollY + (window.innerHeight * 0.5);
      const viewportTop = scrollY - 180;
      const viewportBottom = scrollY + window.innerHeight + 180;

      let stillMoving = false;

      parallaxActive.forEach(element => {
        const item = geometry.get(element);
        if (!item || !element.classList.contains('fx-visible')) return;

        const itemBottom = item.top + item.height;
        if (itemBottom < viewportTop || item.top > viewportBottom) return;

        const center = item.top + (item.height * 0.5);
        const target = clamp((viewportCenter - center) * 0.006, -5, 5);

        // A tiny low-pass interpolation makes large wheel/touch deltas feel
        // organic rather than snapping each element to the new scroll value.
        item.target = target;
        item.current += (target - item.current) * 0.13;

        if (Math.abs(target - item.current) > 0.025) stillMoving = true;

        element.style.setProperty('--fx-parallax', item.current.toFixed(2) + 'px');
      });

      lastScrollY = scrollY;

      if (stillMoving) {
        raf = window.requestAnimationFrame(updateParallax);
      }
    };

    const scheduleParallax = () => {
      if (metricsDirty) refreshGeometry();
      if (!raf) raf = window.requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', scheduleParallax, { passive:true });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      metricsDirty = true;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        refreshGeometry();
        scheduleParallax();
      }, 120);
    }, { passive:true });

    window.addEventListener('load', () => {
      metricsDirty = true;
      refreshGeometry();
      scheduleParallax();
    }, { passive:true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
        return;
      }

      metricsDirty = true;
      refreshGeometry();
      scheduleParallax();
    });

    refreshGeometry();
    scheduleParallax();

    // Dynamic booking/history/filter content is prepared locally instead of
    // rescanning the entire document after every mutation.
    if ('MutationObserver' in window) {
      let mutationTimer = 0;

      const mutationObserver = new MutationObserver(records => {
        const added = [];

        records.forEach(record => {
          record.addedNodes.forEach(node => {
            if (node.nodeType === 1) added.push(node);
          });
        });

        if (!added.length) return;

        window.clearTimeout(mutationTimer);
        mutationTimer = window.setTimeout(() => {
          added.forEach(prepareWithin);

          document.querySelectorAll('.fx-motion:not(.fx-observed)').forEach(element => {
            element.classList.add('fx-observed');
            revealObserver.observe(element);
          });

          parallaxElements.forEach(element => {
            if (!geometry.has(element)) parallaxObserver.observe(element);
          });

          metricsDirty = true;
          scheduleParallax();
        }, 60);
      });

      [document.querySelector('main'), document.querySelector('footer')]
        .filter(Boolean)
        .forEach(target => mutationObserver.observe(target, { childList:true, subtree:true }));
    }
  }
})();

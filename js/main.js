(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const drawer = document.querySelector('[data-booking-drawer]');
  const liveTime = document.querySelector('[data-live-time]');
  const checkin = document.querySelector('[data-booking-checkin]');
  const checkout = document.querySelector('[data-booking-checkout]');
  const guests = document.querySelector('[data-booking-guests]');
  const summary = document.querySelector('[data-booking-summary]');
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = document.querySelector('[data-lightbox-image]');
  const lightboxCaption = document.querySelector('[data-lightbox-caption]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pad = n => String(n).padStart(2, '0');
  const formatTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const setNow = () => { if (liveTime) liveTime.textContent = formatTime(new Date()); };
  setNow();
  window.setInterval(setNow, 30000);

  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const setBookingMinDate = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (checkin && !checkin.min) checkin.min = iso;
    if (checkout && !checkout.min) checkout.min = iso;
  };
  setBookingMinDate();

  const updateSummary = () => {
    if (!summary) return;
    if (!checkin?.value || !checkout?.value) { summary.textContent = 'Choose your dates.'; return; }
    const start = new Date(`${checkin.value}T12:00:00`);
    const end = new Date(`${checkout.value}T12:00:00`);
    const nights = Math.max(0, Math.round((end - start) / 86400000));
    summary.textContent = nights > 0 ? `${nights} night${nights === 1 ? '' : 's'} / ${guests?.value || '2'} guests` : 'Choose a later check-out date.';
  };
  checkin?.addEventListener('change', () => { if (checkout) checkout.min = checkin.value || checkout.min; updateSummary(); });
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

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxImage) { lightboxImage.src = ''; lightboxImage.alt = ''; }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeBooking(); closeLightbox(); } });

  document.querySelectorAll('[data-book-now]').forEach(btn => btn.addEventListener('click', () => {
    const guestCount = guests?.value || '2';
    const msg = checkin?.value && checkout?.value
      ? `Hello, I'd like to check availability at The Still Hotel from ${checkin.value} to ${checkout.value} for ${guestCount} guest${guestCount === '1' ? '' : 's'}.`
      : `Hello, I'd like to ask about booking a room at The Still Hotel for ${guestCount} guest${guestCount === '1' ? '' : 's'}.`;
    window.open(`https://wa.me/6281200000000?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }));

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
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
})();
(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = document.querySelector('[data-lightbox-image]');
  const lightboxCaption = document.querySelector('[data-lightbox-caption]');


// ---------- Gallery lightbox ----------
  let lightboxOpener = null;

  const closeLightbox = () => {
    if (!lightbox) return;

    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');

    if (lightboxImage) {
      lightboxImage.src = '';
      lightboxImage.alt = '';
    }

    const opener = lightboxOpener;
    lightboxOpener = null;
    opener?.focus();
  };

  const openLightbox = item => {
    if (!lightbox || !lightboxImage || !item) return;

    const image = item.querySelector('img');
    if (!image) return;

    const caption = item.querySelector('figcaption')?.textContent || '';
    lightboxOpener = item;

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;

    if (lightboxCaption) lightboxCaption.textContent = caption;

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');

    window.setTimeout(() => {
      lightbox.querySelector('[data-lightbox-close]')?.focus();
    }, 0);
  };

  document.querySelectorAll('[data-lightbox-item]').forEach(item => {
    item.addEventListener('click', () => openLightbox(item));

    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openLightbox(item);
    });
  });

  document.querySelectorAll('[data-lightbox-close]').forEach(btn => {
    btn.addEventListener('click', closeLightbox);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      window.TheStillBookingUI?.close?.();
      closeLightbox();
      window.TheStillRoomRoom?.close?.();
    }
  });
}

})();

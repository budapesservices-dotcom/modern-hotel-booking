(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');

// ---------- Header ----------
  const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 32);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  const getMenuFocusable = () => {
    if (!nav) return [];
    return [...nav.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => {
      if (element.hidden) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      return element.getClientRects().length > 0;
    });
  };

  const closeMenu = (restoreFocus = true) => {
    nav?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    header?.classList.remove('menu-open');
    body.classList.remove('no-scroll');

    if (restoreFocus && menuToggle?.isConnected) {
      window.setTimeout(() => menuToggle.focus(), 0);
    }
  };

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    header?.classList.toggle('menu-open', open);
    body.classList.toggle('no-scroll', open);

    if (open) {
      window.setTimeout(() => getMenuFocusable()[0]?.focus(), 0);
    } else {
      window.setTimeout(() => menuToggle.focus(), 0);
    }
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));

  window.addEventListener('keydown', event => {
    if (!nav?.classList.contains('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getMenuFocusable();
    if (!focusable.length) {
      event.preventDefault();
      menuToggle?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || !nav.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !nav.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

})();
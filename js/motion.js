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
    'main .call-hero-visual',
    'main .login-image',
    'main .contact-location-visual',
    'main .amenity-grid > div',
    'main .price-box',
    'main .call-contact-item',
    'main .contact-form-field',
    'main .booking-empty-state',
    'main .your-booking-card'
  ].join(',');

  const sheenSelectors = [
    'main .room-image',
    'main .image-frame',
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
    'main .call-hero-visual',
    'main .login-image',
    'main .contact-location-visual',
    'main .amenity-grid > div',
    'main .price-box',
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
    '.lightbox *',
    '.site-footer',
    '.site-footer *'
  ].join(',');

  const prepared = new WeakSet();
  const parallaxElements = new Set();
  let revealIndex = 0;
  const geometry = new Map();

  const typeSettings = {
    'heading-major': { y:24, duration:980, delay:60 },
    'heading':       { y:21, duration:900, delay:35 },
    'copy':          { y:14, duration:780, delay:95 },
    'action':        { y:11, duration:690, delay:150 },
    'image':         { y:22, duration:930, delay:55 },
    'list':          { y:13, duration:740, delay:120 },
    'form':          { y:12, duration:700, delay:140 },
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
    return 'block';
  };

  const prepareElement = element => {
    if (prepared.has(element) || isProtected(element)) return;

    prepared.add(element);

    const type = getMotionType(element);
    const config = typeSettings[type] || typeSettings.block;
    const index = revealIndex++;

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

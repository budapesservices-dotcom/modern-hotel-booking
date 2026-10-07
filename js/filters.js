(() => {
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
        tab.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      capacityTabs.forEach(tab => {
        const active =
          String(tab.dataset.roomCapacity || 'all').trim() === activeCapacity;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-pressed', active ? 'true' : 'false');
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
        tab.setAttribute('aria-pressed', active ? 'true' : 'false');
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
})();

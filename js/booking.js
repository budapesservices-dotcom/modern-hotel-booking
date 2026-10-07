(() => {
  const body = document.body;
  const drawer = document.querySelector('[data-booking-drawer]');
  const summary = document.querySelector('[data-booking-summary]');
  const checkin = document.querySelector('[data-booking-checkin]');
  const checkout = document.querySelector('[data-booking-checkout]');
  const guests = document.querySelector('[data-booking-guests]');
  const closeRoomDetail = (restoreFocus = false) => window.TheStillRoomRoom?.close?.(restoreFocus);
  const getRoomAvailability = (...args) => window.TheStillRoomInventory?.getAvailability?.(...args) || null;


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
    bookingOpener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeRoomDetail(false);
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    const closeControl = drawer.querySelector('[data-booking-close].booking-close-button');
    (closeControl || checkin)?.focus();
  };
  const closeBooking = (restoreFocus = true) => {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');

    if (restoreFocus) {
      const opener = bookingOpener;
      bookingOpener = null;
      if (opener?.isConnected) window.setTimeout(() => opener.focus(), 0);
    }
  };
  document.querySelectorAll('[data-booking-open]').forEach(btn => btn.addEventListener('click', openBooking));
  document.querySelectorAll('[data-booking-close]').forEach(btn => btn.addEventListener('click', closeBooking));

  window.addEventListener('still:booking-requested', () => {
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

  document.querySelectorAll('[data-room-detail-booking-now]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomDetailDrawer = document.querySelector('[data-room-detail-drawer]');
      const roomDetailCheckin = document.querySelector('[data-room-detail-checkin]');
      const roomDetailCheckout = document.querySelector('[data-room-detail-checkout]');
      const roomDetailPrice = document.querySelector('[data-room-detail-price]');
      const roomDetailBookedUnder = document.querySelector('[data-room-detail-booked-under]');
      const roomDetailGuests = document.querySelector('[data-room-detail-guests]');

      const roomId = roomDetailDrawer?.dataset.roomId || '';
      const checkinValue = roomDetailCheckin?.value || '';
      const checkoutValue = roomDetailCheckout?.value || '';
      const availability = roomId
        ? getRoomAvailability(roomId, checkinValue, checkoutValue)
        : null;

      if (availability && availability.available <= 0) {
        window.alert('This room type is not available for the selected dates. Please choose different dates.');
        return;
      }

      const activeRoomName =
        document.querySelector('[data-room-detail-title]')?.textContent?.trim() || '';
      const price = roomDetailPrice?.textContent?.replace(/[^0-9.]/g, '') || '';

      window.TheStillBooking?.start({
        roomId,
        room: activeRoomName,
        bookedUnder: roomDetailBookedUnder?.value?.trim() || '',
        checkin: checkinValue,
        checkout: checkoutValue,
        guests: roomDetailGuests?.value || '2',
        price
      });
    });
  });
  
  window.TheStillBookingUI = {
    open: openBooking,
    close: closeBooking,
    refreshSummary: updateSummary
  };


})();

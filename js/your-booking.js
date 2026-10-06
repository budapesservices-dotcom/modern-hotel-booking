/*
 * The Still Hotel — Your Booking
 * Guest reservation view backed by booking-flow.js.
 */

(() => {
  const list = document.querySelector('[data-your-booking-list]');
  const deleteHistoryButton = document.querySelector('[data-delete-booking-history]');
  if (!list) return;

  const STATUS = window.TheStillBooking?.status || {
    CONFIRMED: 'confirmed',
    CANCELLATION_PENDING: 'cancellation_pending',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  };

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatDate = value => {
    if (!value) return 'Not selected';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(date);
  };

  const getNights = booking => {
    if (!booking.checkin || !booking.checkout) return 0;
    const start = new Date(booking.checkin + 'T12:00:00');
    const end = new Date(booking.checkout + 'T12:00:00');
    return Math.max(0, Math.round((end - start) / 86400000));
  };

  const getBookings = () => {
    if (window.TheStillBooking?.getBookings) {
      return window.TheStillBooking.getBookings();
    }

    try {
      const value = JSON.parse(localStorage.getItem('stillHotelBookings') || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const isActive = booking =>
    booking.status === STATUS.CONFIRMED ||
    booking.status === STATUS.CANCELLATION_PENDING;

  const statusLabel = status => ({
    [STATUS.CONFIRMED]: 'Confirmed',
    [STATUS.CANCELLATION_PENDING]: 'Cancellation pending',
    [STATUS.CANCELLED]: 'Cancelled',
    [STATUS.EXPIRED]: 'Expired'
  }[status] || 'Booking');

  const noteFor = status => {
    if (status === STATUS.CANCELLATION_PENDING) {
      return 'Your cancellation request has been sent to the admin desk. The booking remains active until the admin confirms or rejects the request.';
    }

    if (status === STATUS.CANCELLED) {
      return 'Cancellation confirmed by the admin. This booking remains in your history until you remove the history.';
    }

    if (status === STATUS.EXPIRED) {
      return 'This booking code has expired because the checkout date has passed. The record remains in your history.';
    }

    return 'Please bring this Customer Booking ID and show it to reception when you arrive.';
  };

  const requestCancellation = index => {
    const bookings = getBookings();
    const booking = bookings[index];
    if (!booking) return;

    const approvedByGuest = window.confirm(
      'Send a cancellation request to the admin? The booking will stay active until the admin confirms the cancellation.'
    );

    if (!approvedByGuest) return;

    const result = window.TheStillBooking?.requestCancellation(index);
    if (!result?.ok) {
      const message = {
        'not-cancellable': 'This booking is no longer available for cancellation.',
        'stay-started': 'This stay has already started and can no longer be cancelled from the guest page.',
        'storage-error': 'The cancellation request could not be saved.'
      }[result?.reason] || 'The cancellation request could not be completed.';

      window.alert(message);
      return;
    }

    render();
  };

  const deleteHistory = () => {
    const bookings = getBookings();
    const count = bookings.filter(booking =>
      booking.status === STATUS.CANCELLED ||
      booking.status === STATUS.EXPIRED
    ).length;

    if (!count) return;

    const confirmed = window.confirm(
      `Delete ${count} booking history record${count === 1 ? '' : 's'}? Active bookings and pending cancellation requests will not be removed.`
    );

    if (!confirmed) return;

    window.TheStillBooking?.deleteHistory();
    render();
  };

  const render = () => {
    const bookings = getBookings();

    if (deleteHistoryButton) {
      const hasHistory = bookings.some(booking =>
        booking.status === STATUS.CANCELLED ||
        booking.status === STATUS.EXPIRED
      );
      deleteHistoryButton.hidden = !hasHistory;
    }

    if (!bookings.length) {
      list.innerHTML = `
        <div class="booking-empty-state">
          <p class="eyebrow">No booking record</p>
          <h2>Your next stay<br><em>starts here.</em></h2>
          <p>Your confirmed booking will stay here until it is cancelled or its checkout date has passed.</p>
          <a class="button button-dark" href="rooms.html">Find a room</a>
        </div>
      `;
      return;
    }

    list.innerHTML = bookings.map((booking, index) => {
      const nights = getNights(booking);
      const status = String(booking.status || STATUS.CONFIRMED).toLowerCase();
      const active = isActive(booking);
      const cancellable = status === STATUS.CONFIRMED &&
        (!booking.checkin || new Date(booking.checkin + 'T00:00:00') >= new Date(new Date().setHours(0, 0, 0, 0)));

      return `
        <article class="your-booking-card${active ? ' is-current' : ''}${status === STATUS.CANCELLED ? ' is-cancelled' : ''}${status === STATUS.EXPIRED ? ' is-expired' : ''}">
          <div class="your-booking-card-head">
            <div>
              <p class="eyebrow">
                ${status === STATUS.CANCELLED || status === STATUS.EXPIRED
                  ? 'Booking history'
                  : status === STATUS.CANCELLATION_PENDING
                    ? 'Current booking / Admin review'
                    : 'Current booking'}
              </p>
              <h2>${escapeHtml(booking.room || 'Room selection')}</h2>
            </div>
            <span class="your-booking-status status-${escapeHtml(status)}">
              ${escapeHtml(statusLabel(status))}
            </span>
          </div>

          <div class="your-booking-id">
            <span>Customer Booking ID</span>
            <strong>${escapeHtml(booking.customerBookingId || '—')}</strong>
          </div>

          <div class="your-booking-grid">
            <div><span>Check-in</span><strong>${escapeHtml(formatDate(booking.checkin))}</strong></div>
            <div><span>Check-out</span><strong>${escapeHtml(formatDate(booking.checkout))}</strong></div>
            <div><span>Guests</span><strong>${escapeHtml(booking.guests || '2')}</strong></div>
            <div><span>Nights</span><strong>${nights || '—'}</strong></div>
          </div>

          <div class="your-booking-card-footer">
            <p class="your-booking-note">${escapeHtml(noteFor(status))}</p>

            ${cancellable ? `
              <button
                class="your-booking-cancel"
                type="button"
                data-cancel-booking
                data-booking-index="${index}">
                Request cancellation
              </button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    list.querySelectorAll('[data-cancel-booking]').forEach(button => {
      button.addEventListener('click', () => {
        requestCancellation(Number(button.dataset.bookingIndex));
      });
    });
  };

  deleteHistoryButton?.addEventListener('click', deleteHistory);

  render();
  window.addEventListener('storage', event => {
    if (
      event.key === 'stillHotelBookings' ||
      event.key === 'stillHotelAdminNotifications'
    ) render();
  });
  window.addEventListener('still:booking-updated', render);
  window.setInterval(render, 60 * 1000);
})();

/*
 * The Still Hotel — Your Booking
 * Front-end guest booking viewer for the contest/demo build.
 *
 * Reads booking records from localStorage.
 * A real production site must replace this with authenticated server data.
 */

(() => {
  const list = document.querySelector('[data-your-booking-list]');
  if (!list) return;

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatDate = value => {
    if (!value) return 'Not selected';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getNights = booking => {
    if (!booking.checkin || !booking.checkout) return 0;

    const start = new Date(booking.checkin + 'T12:00:00');
    const end = new Date(booking.checkout + 'T12:00:00');
    return Math.max(0, Math.round((end - start) / 86400000));
  };

  const getBookings = () => {
    try {
      const records = JSON.parse(
        localStorage.getItem('stillHotelBookings') || '[]'
      );
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  };

  const saveBookings = bookings => {
    try {
      localStorage.setItem('stillHotelBookings', JSON.stringify(bookings));
    } catch {
      return false;
    }
    return true;
  };

  const isCancellable = booking => {
    if (booking.status !== 'confirmed') return false;
    if (!booking.checkin) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkin = new Date(booking.checkin + 'T00:00:00');
    return checkin >= today;
  };

  const cancelBooking = index => {
    const bookings = getBookings();
    const booking = bookings[index];
    if (!booking || !isCancellable(booking)) return;

    const confirmed = window.confirm(
      'Cancel this booking? This demo will mark the reservation as cancelled.'
    );

    if (!confirmed) return;

    bookings[index] = {
      ...booking,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };

    saveBookings(bookings);
    render();

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stillHotelBookings',
      newValue: JSON.stringify(bookings)
    }));
  };

  const render = () => {
    const bookings = getBookings();

    if (!bookings.length) {
      list.innerHTML = `
        <div class="booking-empty-state">
          <p class="eyebrow">No active booking</p>
          <h2>Your next stay<br><em>starts here.</em></h2>
          <p>Your confirmed booking will appear here after you complete the booking flow.</p>
          <a class="button button-dark" href="rooms.html">Find a room</a>
        </div>
      `;
      return;
    }

    list.innerHTML = bookings.map((booking, index) => {
      const nights = getNights(booking);
      const status = String(booking.status || 'confirmed').toLowerCase();
      const cancellable = isCancellable(booking);

      return `
        <article class="your-booking-card${index === 0 && status === 'confirmed' ? ' is-current' : ''}${status === 'cancelled' ? ' is-cancelled' : ''}">
          <div class="your-booking-card-head">
            <div>
              <p class="eyebrow">
                ${status === 'cancelled'
                  ? 'Booking history / Cancelled'
                  : index === 0
                    ? 'Current booking'
                    : 'Booking history'}
              </p>
              <h2>${escapeHtml(booking.room || 'Room selection')}</h2>
            </div>
            <span class="your-booking-status status-${escapeHtml(status)}">
              ${escapeHtml(status)}
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
            <p class="your-booking-note">
              ${status === 'cancelled'
                ? 'This booking has been cancelled and kept in your booking history.'
                : 'Please bring this Customer Booking ID and show it to reception when you arrive.'}
            </p>

            ${cancellable
              ? `
                <button
                  class="your-booking-cancel"
                  type="button"
                  data-cancel-booking
                  data-booking-index="${index}">
                  Cancel booking
                </button>
              `
              : ''}
          </div>
        </article>
      `;
    }).join('');

    list.querySelectorAll('[data-cancel-booking]').forEach(button => {
      button.addEventListener('click', () => {
        cancelBooking(Number(button.dataset.bookingIndex));
      });
    });
  };

  render();
  window.addEventListener('storage', render);
})();

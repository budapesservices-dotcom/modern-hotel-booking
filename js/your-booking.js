/*
 * The Still Hotel — Your Booking
 * Front-end guest booking viewer for the contest/demo build.
 *
 * Reads the booking records created by booking-flow.js from localStorage.
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

  const getBookings = () => {
    try {
      const records = JSON.parse(localStorage.getItem('stillHotelBookings') || '[]');
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
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
      const nights = booking.checkin && booking.checkout
        ? Math.max(
            0,
            Math.round(
              (new Date(booking.checkout + 'T12:00:00') -
               new Date(booking.checkin + 'T12:00:00')) / 86400000
            )
          )
        : 0;

      return `
        <article class="your-booking-card${index === 0 ? ' is-current' : ''}">
          <div class="your-booking-card-head">
            <div>
              <p class="eyebrow">${index === 0 ? 'Current booking' : 'Booking history'}</p>
              <h2>${escapeHtml(booking.room || 'Room selection')}</h2>
            </div>
            <span class="your-booking-status">${escapeHtml(booking.status || 'confirmed')}</span>
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

          <p class="your-booking-note">
            Please bring this Customer Booking ID and show it to reception when you arrive.
          </p>
        </article>
      `;
    }).join('');
  };

  render();
  window.addEventListener('storage', render);
})();

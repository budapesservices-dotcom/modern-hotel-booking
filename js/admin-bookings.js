/*
 * The Still Hotel — Admin Booking Desk
 * Front-end demo only.
 *
 * Reads the same localStorage records created by booking-flow.js.
 * This is intentionally not a real admin/authentication system.
 */

(() => {
  const list = document.querySelector('[data-admin-booking-list]');
  const stats = document.querySelector('[data-admin-stats]');
  if (!list) return;

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const formatDate = value => {
    if (!value) return '—';
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

    if (stats) {
      stats.innerHTML = `
        <div><span>Total records</span><strong>${bookings.length}</strong></div>
        <div><span>Confirmed</span><strong>${bookings.filter(b => b.status === 'confirmed').length}</strong></div>
      `;
    }

    if (!bookings.length) {
      list.innerHTML = `
        <div class="admin-booking-empty">
          <p class="eyebrow">No booking records</p>
          <h2>The desk is<br><em>quiet.</em></h2>
          <p>Completed demo bookings will appear here.</p>
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
        <article class="admin-booking-row">
          <div class="admin-booking-row-top">
            <span>#${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(booking.room || 'Room selection')}</strong>
            <em>${escapeHtml(booking.status || 'confirmed')}</em>
          </div>

          <div class="admin-booking-ids">
            <div>
              <span>Customer ID</span>
              <strong>${escapeHtml(booking.customerBookingId || '—')}</strong>
            </div>
            <div>
              <span>Admin ID</span>
              <strong>${escapeHtml(booking.adminBookingId || '—')}</strong>
            </div>
          </div>

          <div class="admin-booking-meta">
            <div><span>Check-in</span><strong>${escapeHtml(formatDate(booking.checkin))}</strong></div>
            <div><span>Check-out</span><strong>${escapeHtml(formatDate(booking.checkout))}</strong></div>
            <div><span>Guests</span><strong>${escapeHtml(booking.guests || '2')}</strong></div>
            <div><span>Nights</span><strong>${nights || '—'}</strong></div>
          </div>
        </article>
      `;
    }).join('');
  };

  render();
  window.addEventListener('storage', render);
})();

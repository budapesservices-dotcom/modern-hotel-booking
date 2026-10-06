/*
 * The Still Hotel — Admin Booking Desk
 * Front-end demo queue for booking, cancellation and expiry events.
 */

(() => {
  const list = document.querySelector('[data-admin-booking-list]');
  const stats = document.querySelector('[data-admin-stats]');
  const notifications = document.querySelector('[data-admin-notifications]');
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
    if (!value) return '—';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(date);
  };

  const formatDateTime = value => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getBookings = () =>
    window.TheStillBooking?.getBookings?.() || [];

  const getNotifications = () =>
    window.TheStillBooking?.getNotifications?.() || [];

  const resolveCancellation = (notification, approved) => {
    const identifier =
      notification.requestId ||
      notification.adminBookingId ||
      notification.customerBookingId ||
      notification.bookingToken;

    const result = window.TheStillBooking?.resolveCancellation(identifier, approved);

    if (!result?.ok) {
      window.alert(
        approved
          ? 'This cancellation request is no longer pending.'
          : 'This cancellation request is no longer pending.'
      );
      render();
      return;
    }

    render();
  };

  const renderNotifications = () => {
    if (!notifications) return;

    const items = getNotifications();

    if (!items.length) {
      notifications.innerHTML = `
        <div class="admin-notification-empty">
          <span>ADMIN NOTIFICATIONS</span>
          <strong>No new booking events.</strong>
        </div>
      `;
      return;
    }

    notifications.innerHTML = `
      <div class="admin-notification-head">
        <div>
          <span>OPERATIONS / NOTIFICATIONS</span>
          <h2>Keep an eye<br><em>on every stay.</em></h2>
        </div>
        <strong>${items.filter(item => item.status === 'pending').length} pending</strong>
      </div>

      <div class="admin-notification-list">
        ${items.map(item => {
          const isCancellation = item.type === 'cancellation';
          const isPending = item.status === 'pending';

          return `
            <article class="admin-notification-card is-${escapeHtml(item.status)} is-${escapeHtml(item.type)}">
              <div class="admin-notification-card-head">
                <div>
                  <span>${isCancellation ? 'CANCELLATION REQUEST' : 'BOOKING EVENT'}</span>
                  <h3>${escapeHtml(item.title || 'Booking notification')}</h3>
                </div>
                <em>${escapeHtml(item.status || 'pending')}</em>
              </div>

              <p>${escapeHtml(item.message || '')}</p>

              <div class="admin-notification-meta">
                <div><span>Customer ID</span><strong>${escapeHtml(item.customerBookingId || '—')}</strong></div>
                <div><span>Admin ID</span><strong>${escapeHtml(item.adminBookingId || '—')}</strong></div>
                <div><span>Event time</span><strong>${escapeHtml(formatDateTime(item.createdAt))}</strong></div>
              </div>

              ${isCancellation && isPending ? `
                <div class="admin-notification-actions">
                  <button
                    class="admin-notification-approve"
                    type="button"
                    data-cancel-approve
                    data-request-id="${escapeHtml(item.requestId || '')}">
                    Confirm cancellation
                  </button>
                  <button
                    class="admin-notification-reject"
                    type="button"
                    data-cancel-reject
                    data-request-id="${escapeHtml(item.requestId || '')}">
                    Keep booking
                  </button>
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </div>
    `;

    notifications.querySelectorAll('[data-cancel-approve]').forEach(button => {
      button.addEventListener('click', () => {
        const item = items.find(notification =>
          notification.requestId === button.dataset.requestId
        );
        if (item) resolveCancellation(item, true);
      });
    });

    notifications.querySelectorAll('[data-cancel-reject]').forEach(button => {
      button.addEventListener('click', () => {
        const item = items.find(notification =>
          notification.requestId === button.dataset.requestId
        );
        if (item) resolveCancellation(item, false);
      });
    });
  };

  const renderBookings = () => {
    const bookings = getBookings();

    if (stats) {
      stats.innerHTML = `
        <div><span>Total records</span><strong>${bookings.length}</strong></div>
        <div><span>Confirmed</span><strong>${bookings.filter(b => b.status === STATUS.CONFIRMED).length}</strong></div>
        <div><span>Cancellation pending</span><strong>${bookings.filter(b => b.status === STATUS.CANCELLATION_PENDING).length}</strong></div>
        <div><span>Expired</span><strong>${bookings.filter(b => b.status === STATUS.EXPIRED).length}</strong></div>
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
        ? Math.max(0, Math.round(
            (new Date(booking.checkout + 'T12:00:00') -
             new Date(booking.checkin + 'T12:00:00')) / 86400000
          ))
        : 0;

      const status = String(booking.status || STATUS.CONFIRMED);
      const statusLabel = {
        [STATUS.CONFIRMED]: 'Confirmed',
        [STATUS.CANCELLATION_PENDING]: 'Cancellation pending',
        [STATUS.CANCELLED]: 'Cancelled',
        [STATUS.EXPIRED]: 'Expired'
      }[status] || status;

      return `
        <article class="admin-booking-row is-${escapeHtml(status)}">
          <div class="admin-booking-row-top">
            <span>#${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(booking.room || 'Room selection')}</strong>
            <em>${escapeHtml(statusLabel)}</em>
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

          ${status === STATUS.CANCELLATION_PENDING ? `
            <p class="admin-booking-state-note">Customer cancellation is waiting for admin confirmation above.</p>
          ` : status === STATUS.EXPIRED ? `
            <p class="admin-booking-state-note">This booking ID is no longer valid because the checkout date has passed.</p>
          ` : status === STATUS.CANCELLED ? `
            <p class="admin-booking-state-note">Cancellation was confirmed by the admin and the record remains in history.</p>
          ` : ''}
        </article>
      `;
    }).join('');
  };

  const render = () => {
    window.TheStillBooking?.expireOverdueBookings?.();
    renderNotifications();
    renderBookings();
  };

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

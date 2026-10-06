/*
 * The Still Hotel — Booking Flow
 * --------------------------------
 * Front-end booking gate + confirmation UI.
 *
 * Flow:
 *   Booking button
 *      -> booking-flow.js
 *      -> check authentication
 *          -> not logged in: redirect to login.html
 *          -> logged in / demo bypass: show booking confirmation
 *      -> Continue
 *      -> next booking step
 *
 * Current contest/demo mode:
 *   BYPASS_LOGIN = true
 *
 * Client hand-off later:
 *   1. Set BYPASS_LOGIN to false.
 *   2. Connect hasSession() to the real authentication layer.
 *   3. Replace proceedToBooking() with the client's real booking endpoint.
 *
 * No credentials, passwords, or personal contact data belong in this file.
 */

(() => {
  const BYPASS_LOGIN = true;
  const LOGIN_URL = 'login.html';
  const WHATSAPP_NUMBER = '620000000000';
  const MODAL_ID = 'still-booking-confirmation';

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

  const getNights = (checkin, checkout) => {
    if (!checkin || !checkout) return 0;

    const start = new Date(checkin + 'T12:00:00');
    const end = new Date(checkout + 'T12:00:00');
    const nights = Math.round((end - start) / 86400000);

    return Math.max(0, nights);
  };

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const hasSession = () => {
    // Client integration point:
    // return true only when the site's real authentication layer
    // confirms that a guest is signed in.
    return Boolean(window.TheStillAuth?.isAuthenticated);
  };

  const redirectToLogin = bookingData => {
    try {
      sessionStorage.setItem(
        'stillHotelPendingBooking',
        JSON.stringify(bookingData)
      );
    } catch {
      // Session storage may be unavailable; login can still be opened.
    }

    const params = new URLSearchParams({
      returnTo: window.location.href
    });

    window.location.href = `${LOGIN_URL}?${params.toString()}`;
  };

  const closeConfirmation = () => {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('still-booking-modal-open');

    window.setTimeout(() => {
      if (modal.parentNode) modal.remove();
    }, 260);
  };

  const proceedToBooking = bookingData => {
    window.dispatchEvent(new CustomEvent('still:booking-confirmed'));

    const guestCount = bookingData.guests || '2';
    const roomPart = bookingData.room ? ` for ${bookingData.room}` : '';
    const datePart = bookingData.checkin && bookingData.checkout
      ? ` from ${bookingData.checkin} to ${bookingData.checkout}`
      : '';

    const message =
      `Hello, I'd like to ask about booking a room at The Still Hotel${roomPart}${datePart} for ${guestCount} guest${guestCount === '1' ? '' : 's'}.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener'
    );
  };

  const showConfirmation = bookingData => {
    const previous = document.getElementById(MODAL_ID);
    if (previous) previous.remove();

    const nights = getNights(bookingData.checkin, bookingData.checkout);
    const nightlyPrice = Number(bookingData.price) || 0;
    const total = nightlyPrice > 0 && nights > 0 ? nightlyPrice * nights : 0;
    const totalText = total > 0
      ? '$' + total.toLocaleString('en-US')
      : 'To be confirmed';

    const guestCount = String(bookingData.guests || '2');
    const hasRoom = Boolean(bookingData.room);

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'still-booking-modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="still-booking-modal-backdrop" data-booking-confirm-cancel></div>

      <section
        class="still-booking-receipt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="still-booking-receipt-title">

        <div class="still-booking-receipt-head">
          <p class="eyebrow">The Still Hotel / Booking review</p>
          <span>PRE-CONFIRMATION</span>
        </div>

        <div class="still-booking-receipt-title-row">
          <div>
            <p class="still-booking-receipt-kicker">Please review your stay</p>
            <h2 id="still-booking-receipt-title">
              Your booking<br><em>details.</em>
            </h2>
          </div>
          <div class="still-booking-receipt-mark" aria-hidden="true">TS</div>
        </div>

        <div class="still-booking-receipt-body">
          <div class="still-booking-receipt-section">
            <p class="still-booking-receipt-label">Stay</p>

            <div class="still-booking-receipt-line">
              <span>Room</span>
              <strong>${escapeHtml(hasRoom ? bookingData.room : 'Room selection')}</strong>
            </div>

            <div class="still-booking-receipt-line">
              <span>Guests</span>
              <strong>${escapeHtml(guestCount)} guest${guestCount === '1' ? '' : 's'}</strong>
            </div>

            <div class="still-booking-receipt-line">
              <span>Check-in</span>
              <strong>${escapeHtml(formatDate(bookingData.checkin))}</strong>
            </div>

            <div class="still-booking-receipt-line">
              <span>Check-out</span>
              <strong>${escapeHtml(formatDate(bookingData.checkout))}</strong>
            </div>

            <div class="still-booking-receipt-line">
              <span>Nights</span>
              <strong>${nights || 'To be confirmed'}</strong>
            </div>

            <div class="still-booking-receipt-line">
              <span>Rate total</span>
              <strong>${escapeHtml(totalText)}</strong>
            </div>
          </div>

          <div class="still-booking-terms">
            <p class="still-booking-receipt-label">Before you continue</p>
            <p>
              Booking requests are subject to room availability. Any rate,
              tax, deposit, cancellation policy, and special-request conditions
              will be confirmed before the reservation is finalized.
            </p>
            <p>
              Continuing sends this request to the next booking step.
              No payment is taken at this stage.
            </p>
            <p>
              By selecting Continue, you acknowledge that final availability,
              rates, taxes, deposits, and cancellation terms must be confirmed
              before the stay is finalized.
            </p>
          </div>
        </div>

        <div class="still-booking-receipt-actions">
          <button
            class="still-booking-cancel"
            type="button"
            data-booking-confirm-cancel>Cancel</button>

          <button
            class="button button-dark still-booking-continue"
            type="button"
            data-booking-confirm-continue>
            Continue <span>→</span>
          </button>
        </div>
      </section>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('still-booking-modal-open');

    modal.querySelectorAll('[data-booking-confirm-cancel]').forEach(button => {
      button.addEventListener('click', closeConfirmation);
    });

    modal.querySelector('[data-booking-confirm-continue]')?.addEventListener(
      'click',
      () => {
        closeConfirmation();
        proceedToBooking(bookingData);
      }
    );

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');

    window.setTimeout(() => {
      modal.querySelector('.still-booking-continue')?.focus();
    }, 60);
  };

  const startBooking = bookingData => {
    const data = {
      room: bookingData?.room || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2',
      price: bookingData?.price || ''
    };

    /*
     * Authentication is checked BEFORE confirmation.
     * The client can disable BYPASS_LOGIN when real authentication is ready.
     */
    if (!BYPASS_LOGIN && !hasSession()) {
      redirectToLogin(data);
      return;
    }

    // Authenticated (or contest/demo bypass): now show the receipt.
    showConfirmation(data);
  };

  window.TheStillBooking = {
    start: startBooking,
    config: {
      bypassLogin: BYPASS_LOGIN,
      loginUrl: LOGIN_URL
    }
  };
})();

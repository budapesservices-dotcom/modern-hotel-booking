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
 *   3. Replace the local success state with the client's real reservation service.
 *
 * Each booking receives one shared token and two paired IDs:
 *   customerBookingId -> shown to the guest.
 *   adminBookingId    -> kept for the admin booking desk.
 * Both IDs are generated together from the same booking token.
 *
 * No credentials, passwords, or personal contact data belong in this file.
 */

(() => {
  const BYPASS_LOGIN = true;
  const LOGIN_URL = 'login.html';
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

  const generateBookingIdPair = () => {
    const now = new Date();
    const datePart =
      String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    const makeToken = () => {
      if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
      }

      if (window.crypto?.getRandomValues) {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(4)))
          .map(value => value.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      }

      return Math.random().toString(36).slice(2, 14).toUpperCase();
    };

    let token = makeToken();

    // Avoid local collisions when multiple demo bookings are created
    // in the same browser.
    try {
      const existing = JSON.parse(localStorage.getItem('stillHotelBookings') || '[]');
      const usedTokens = new Set(existing.map(item => item?.bookingToken).filter(Boolean));

      while (usedTokens.has(token)) token = makeToken();
    } catch {
      // Keep the generated token when storage is unavailable.
    }

    return {
      token,
      customerId: `STL-C-${datePart}-${token}`,
      adminId: `STL-A-${datePart}-${token}`
    };
  };

  const showBookingSuccess = (modal, bookingData) => {
    if (!modal) return;

    const bookingIds = generateBookingIdPair();
    const scheduledDate = bookingData.checkin
      ? new Date(bookingData.checkin + 'T12:00:00')
      : null;
    const scheduledText = scheduledDate && !Number.isNaN(scheduledDate.getTime())
      ? new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(scheduledDate)
      : 'your scheduled check-in date';

    try {
      const bookingRecord = {
        ...bookingData,
        bookingToken: bookingIds.token,
        customerBookingId: bookingIds.customerId,
        adminBookingId: bookingIds.adminId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const existingBookings = JSON.parse(
        localStorage.getItem('stillHotelBookings') || '[]'
      );

      localStorage.setItem(
        'stillHotelBookings',
        JSON.stringify([bookingRecord, ...existingBookings].slice(0, 25))
      );

      localStorage.setItem('stillHotelCurrentBookingId', bookingIds.customerId);
    } catch {
      // Local browser storage is optional for this front-end demo.
    }

    modal.querySelector('.still-booking-receipt')?.classList.add('is-success');

    const receipt = modal.querySelector('.still-booking-receipt');
    if (!receipt) return;

    receipt.innerHTML = `
      <div class="still-booking-success">
        <div class="still-booking-receipt-head">
          <p class="eyebrow">The Still Hotel / Booking confirmed</p>
          <span>THANK YOU</span>
        </div>

        <div class="still-booking-success-mark" aria-hidden="true">✓</div>

        <div class="still-booking-success-copy">
          <p class="still-booking-receipt-kicker">Your stay is noted</p>
          <h2>Your booking<br><em>is confirmed.</em></h2>

          <p class="still-booking-success-message">
            Thank you for choosing The Still Hotel. Please arrive on
            <strong>${escapeHtml(scheduledText)}</strong> according to your
            scheduled time and show the Booking ID below to our reception team.
          </p>
        </div>

        <div class="still-booking-id-block">
          <span>CUSTOMER BOOKING ID</span>
          <strong>${escapeHtml(bookingIds.customerId)}</strong>
        </div>

        <div class="still-booking-success-note">
          <p>
            Keep this Booking ID with you when you arrive. Our reception team
            will use it to locate your booking details.
          </p>
          <p>We look forward to welcoming you. Enjoy your stay at The Still Hotel.</p>
        </div>

        <div class="still-booking-success-actions">
          <button
            class="button button-dark still-booking-understand"
            type="button"
            data-booking-understand>
            Mengerti
          </button>
        </div>
      </div>
    `;

    receipt.querySelector('[data-booking-understand]')?.addEventListener(
      'click',
      () => {
        closeConfirmation();
        window.dispatchEvent(new CustomEvent('still:booking-confirmed', {
          detail: {
            ...bookingData,
            customerBookingId: bookingIds.customerId,
            adminBookingId: bookingIds.adminId
          }
        }));
      }
    );

    window.setTimeout(() => {
      receipt.querySelector('[data-booking-understand]')?.focus();
    }, 60);
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
            Continue
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
        showBookingSuccess(modal, bookingData);
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

/*
 * The Still Hotel — Booking Flow
 * --------------------------------
 * Front-end routing layer for booking actions.
 *
 * Current contest/demo mode:
 *   BYPASS_LOGIN = true
 *
 * This intentionally assumes the guest is already authenticated so the
 * existing front-end booking flow can continue without a backend.
 *
 * Client hand-off later:
 *   1. Set BYPASS_LOGIN to false.
 *   2. Replace hasSession() with the real authentication/session check.
 *   3. Keep the final booking destination in proceedToBooking().
 *
 * No credentials, passwords, or personal contact data belong in this file.
 */

(() => {
  const BYPASS_LOGIN = true;
  const LOGIN_URL = 'login.html';
  const WHATSAPP_NUMBER = '620000000000';

  const hasSession = () => {
    // Client integration point:
    // return true only when the site's real authentication layer
    // confirms that a guest is signed in.
    return Boolean(window.TheStillAuth?.isAuthenticated);
  };

  const redirectToLogin = bookingData => {
    try {
      sessionStorage.setItem('stillHotelPendingBooking', JSON.stringify(bookingData));
    } catch {
      // Session storage may be unavailable; login can still be opened.
    }

    const params = new URLSearchParams({
      returnTo: window.location.href
    });
    window.location.href = `${LOGIN_URL}?${params.toString()}`;
  };

  const proceedToBooking = bookingData => {
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

  const startBooking = bookingData => {
    const data = {
      room: bookingData?.room || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2'
    };

    if (!BYPASS_LOGIN && !hasSession()) {
      redirectToLogin(data);
      return;
    }

    proceedToBooking(data);
  };

  window.TheStillBooking = {
    start: startBooking,
    config: {
      bypassLogin: BYPASS_LOGIN,
      loginUrl: LOGIN_URL
    }
  };
})();

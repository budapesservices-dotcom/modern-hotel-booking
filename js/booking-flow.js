/*
 * The Still Hotel — Booking Flow
 * --------------------------------
 * Front-end booking router.
 *
 * Current contest/demo mode:
 *   BYPASS_LOGIN = true
 *
 * Flow:
 *   Booking button
 *      -> booking-flow.js
 *      -> booking-confirmation.js
 *      -> Continue
 *      -> auth check / next booking step
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

  const routeAfterConfirmation = bookingData => {
    if (!BYPASS_LOGIN && !hasSession()) {
      redirectToLogin(bookingData);
      return;
    }

    proceedToBooking(bookingData);
  };

  const startBooking = bookingData => {
    const data = {
      room: bookingData?.room || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2',
      price: bookingData?.price || ''
    };

    const confirmation = window.TheStillBookingConfirmation;

    if (!confirmation?.show) {
      // Fail safely if the confirmation layer was not loaded.
      console.error('The Still Hotel booking confirmation is unavailable.');
      return;
    }

    confirmation.show(data, {
      onContinue: () => routeAfterConfirmation(data)
    });
  };

  window.TheStillBooking = {
    start: startBooking,
    config: {
      bypassLogin: BYPASS_LOGIN,
      loginUrl: LOGIN_URL
    }
  };
})();

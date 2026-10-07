

(() => {
  const BYPASS_LOGIN = true;
  const BYPASS_ADMIN_CANCELLATION = true;
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

  const MAX_STAY_NIGHTS = 30;

  const getNights = (checkin, checkout) => {
    if (!checkin || !checkout) return 0;

    const start = new Date(checkin + 'T12:00:00');
    const end = new Date(checkout + 'T12:00:00');
    const nights = Math.round((end - start) / 86400000);

    return Math.max(0, nights);
  };

  const validateBookingDates = (checkin, checkout) => {
    if (!checkin || !checkout) {
      return {
        valid: false,
        message: 'Please select both a check-in and check-out date.'
      };
    }

    const start = new Date(checkin + 'T12:00:00');
    const end = new Date(checkout + 'T12:00:00');

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        valid: false,
        message: 'Please choose valid check-in and check-out dates.'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return {
        valid: false,
        message: 'Check-in must be today or a future date.'
      };
    }

    if (end <= start) {
      return {
        valid: false,
        message: 'Check-out must be at least one day after check-in.'
      };
    }

    const nights = Math.round((end - start) / 86400000);
    if (nights > MAX_STAY_NIGHTS) {
      return {
        valid: false,
        message: 'A stay cannot exceed 30 nights. Please choose an earlier check-out date.'
      };
    }

    return {
      valid: true,
      checkin: start,
      checkout: end
    };
  };

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');


  const STORAGE={bookings:'stillHotelBookings',notifications:'stillHotelAdminNotifications',current:'stillHotelCurrentBookingId'};
  const STATUS={REQUESTED:'request_received',CONFIRMED:'confirmed',CANCELLATION_PENDING:'cancellation_pending',CANCELLED:'cancelled',EXPIRED:'expired'};
  const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'');return value??fallback;}catch{return fallback;}};
  const getBookings=()=>{const value=readJson(STORAGE.bookings,[]);return Array.isArray(value)?value:[];};
  const saveBookings=bookings=>{
    try{
      const serialized=JSON.stringify(bookings);
      localStorage.setItem(STORAGE.bookings,serialized);
      return localStorage.getItem(STORAGE.bookings)===serialized;
    }catch{
      return false;
    }
  };
  const getNotifications=()=>{const value=readJson(STORAGE.notifications,[]);return Array.isArray(value)?value:[];};
  const saveNotifications=notifications=>{try{localStorage.setItem(STORAGE.notifications,JSON.stringify(notifications));return true;}catch{return false;}};
  const emitBookingUpdate=detail=>window.dispatchEvent(new CustomEvent('still:booking-updated',{detail:detail||{}}));
  const persistBookingRequest=(bookingRecord,customerBookingId)=>{
    let previousBookings=null;
    let previousCurrent=null;

    try{
      previousBookings=localStorage.getItem(STORAGE.bookings);
      previousCurrent=localStorage.getItem(STORAGE.current);

      const nextBookings=[bookingRecord,...getBookings()].slice(0,25);
      const serialized=JSON.stringify(nextBookings);

      localStorage.setItem(STORAGE.bookings,serialized);
      if(localStorage.getItem(STORAGE.bookings)!==serialized){
        throw new Error('Booking records could not be verified after saving.');
      }

      localStorage.setItem(STORAGE.current,customerBookingId);
      if(localStorage.getItem(STORAGE.current)!==customerBookingId){
        throw new Error('Current booking ID could not be verified after saving.');
      }

      return {ok:true};
    }catch{
      try{
        if(previousBookings===null){
          localStorage.removeItem(STORAGE.bookings);
        }else{
          localStorage.setItem(STORAGE.bookings,previousBookings);
        }
      }catch{}

      try{
        if(previousCurrent===null){
          localStorage.removeItem(STORAGE.current);
        }else{
          localStorage.setItem(STORAGE.current,previousCurrent);
        }
      }catch{}

      return {
        ok:false,
        reason:'storage-error'
      };
    }
  };

  const notifyAdmin=({type,booking,requestId='',title,message,status='pending'})=>{
    if(!booking?.bookingToken)return false;
    const id=requestId?`${type}:${requestId}`:`${type}:${booking.bookingToken}`;
    const notifications=getNotifications();
    if(notifications.some(item=>item.id===id))return false;
    notifications.unshift({id,type,status,requestId,bookingToken:booking.bookingToken,customerBookingId:booking.customerBookingId||'',adminBookingId:booking.adminBookingId||'',room:booking.room||'',checkin:booking.checkin||'',checkout:booking.checkout||'',title,message,createdAt:new Date().toISOString()});
    return saveNotifications(notifications.slice(0,100));
  };
  const checkoutHasPassed=booking=>{
    if(!booking?.checkout)return false;
    const today=new Date(); today.setHours(0,0,0,0);
    const checkout=new Date(booking.checkout+'T00:00:00');
    return !Number.isNaN(checkout.getTime())&&today>checkout;
  };
  const expireOverdueBookings=()=>{
    const bookings=getBookings(); let changed=false;
    const next=bookings.map(booking=>{
      const canExpire=booking.status===STATUS.REQUESTED||booking.status===STATUS.CONFIRMED||booking.status===STATUS.CANCELLATION_PENDING;
      if(!canExpire||!checkoutHasPassed(booking))return booking;
      const expired={...booking,status:STATUS.EXPIRED,expiredAt:booking.expiredAt||new Date().toISOString()};
      notifyAdmin({type:'expiry',booking:expired,status:'logged',title:'Booking ID expired',message:`Admin Booking ID ${expired.adminBookingId||'—'} has expired after the checkout date.`});
      changed=true; return expired;
    });
    if(changed){
      const expiredRequestIds=new Set(
        next.filter(booking=>booking.status===STATUS.EXPIRED&&booking.cancellationRequestId)
          .map(booking=>booking.cancellationRequestId)
      );
      saveBookings(next);
      if(expiredRequestIds.size){
        saveNotifications(getNotifications().map(notification=>
          notification.type==='cancellation' &&
          notification.status==='pending' &&
          expiredRequestIds.has(notification.requestId)
            ? {...notification,status:'expired',resolvedAt:new Date().toISOString()}
            : notification
        ));
      }
      emitBookingUpdate({reason:'booking-expired'});
    }
    return next;
  };
  const requestCancellation=identifier=>{
    const bookings=expireOverdueBookings();
    const index=typeof identifier==='number'?identifier:bookings.findIndex(booking=>booking.customerBookingId===identifier||booking.adminBookingId===identifier||booking.bookingToken===identifier);
    if(index<0)return{ok:false,reason:'not-found'};
    const booking=bookings[index];
    if(booking.status!==STATUS.REQUESTED&&booking.status!==STATUS.CONFIRMED)return{ok:false,reason:'not-cancellable',booking};
    if(booking.checkin){
      const today=new Date(); today.setHours(0,0,0,0);
      const checkin=new Date(booking.checkin+'T00:00:00');
      if(!Number.isNaN(checkin.getTime())&&checkin<today)return{ok:false,reason:'stay-started',booking};
    }
    const requestId=`${booking.bookingToken}-CXL-${Date.now().toString(36).toUpperCase()}`;
    const requestedAt=new Date().toISOString();

    if(BYPASS_ADMIN_CANCELLATION){
      const updated={
        ...booking,
        status:STATUS.CANCELLED,
        cancellationRequestId:requestId,
        cancellationRequestedAt:requestedAt,
        cancellationConfirmedAt:requestedAt,
        cancellationMode:'demo-bypass'
      };
      const next=[...bookings]; next[index]=updated;
      if(!saveBookings(next))return{ok:false,reason:'storage-error',booking};

      notifyAdmin({
        type:'cancellation',
        booking:updated,
        requestId,
        status:'auto-approved',
        title:'Cancellation confirmed (demo)',
        message:`Customer ${updated.customerBookingId||'—'} requested cancellation of Admin Booking ID ${updated.adminBookingId||'—'}. Demo mode auto-confirms the cancellation without waiting for admin action.`
      });

      emitBookingUpdate({reason:'cancellation-auto-approved',booking:updated});
      return{ok:true,booking:updated};
    }

    const updated={...booking,status:STATUS.CANCELLATION_PENDING,cancellationPreviousStatus:booking.status,cancellationRequestId:requestId,cancellationRequestedAt:requestedAt};
    const next=[...bookings]; next[index]=updated;
    if(!saveBookings(next))return{ok:false,reason:'storage-error',booking};
    notifyAdmin({type:'cancellation',booking:updated,requestId,title:'Cancellation request',message:`Customer ${updated.customerBookingId||'—'} requested cancellation of Admin Booking ID ${updated.adminBookingId||'—'}.`});
    emitBookingUpdate({reason:'cancellation-requested',booking:updated});
    return{ok:true,booking:updated};
  };
  const resolveCancellation=(identifier,approved)=>{
    const bookings=expireOverdueBookings();
    const index=bookings.findIndex(booking=>booking.cancellationRequestId===identifier||booking.customerBookingId===identifier||booking.adminBookingId===identifier||booking.bookingToken===identifier);
    if(index<0)return{ok:false,reason:'not-found'};
    const booking=bookings[index];
    if(booking.status!==STATUS.CANCELLATION_PENDING)return{ok:false,reason:'not-pending',booking};
    const restoredStatus=booking.cancellationPreviousStatus===STATUS.REQUESTED?STATUS.REQUESTED:STATUS.CONFIRMED;
    const updated={...booking,status:approved?STATUS.CANCELLED:restoredStatus,cancellationConfirmedAt:approved?new Date().toISOString():null,cancellationRejectedAt:approved?null:new Date().toISOString(),cancellationPreviousStatus:null};
    const next=[...bookings]; next[index]=updated;
    if(!saveBookings(next))return{ok:false,reason:'storage-error',booking};
    saveNotifications(getNotifications().map(notification=>notification.type==='cancellation'&&notification.requestId===booking.cancellationRequestId?{...notification,status:approved?'approved':'rejected',resolvedAt:new Date().toISOString()}:notification));
    emitBookingUpdate({reason:approved?'cancellation-approved':'cancellation-rejected',booking:updated});
    return{ok:true,booking:updated};
  };
  const deleteHistory=()=>{
    const bookings=expireOverdueBookings();
    const history=new Set([STATUS.CANCELLED,STATUS.EXPIRED]);
    const remaining=bookings.filter(booking=>!history.has(booking.status));
    const removed=bookings.length-remaining.length;
    if(!removed)return{ok:true,removed:0};
    saveBookings(remaining);
    const current=localStorage.getItem(STORAGE.current)||'';
    if(!remaining.some(booking=>booking.customerBookingId===current)){
      try{localStorage.removeItem(STORAGE.current);}catch{}
    }
    emitBookingUpdate({reason:'history-deleted',count:removed});
    return{ok:true,removed};
  };

  const hasSession = () => {

    return Boolean(window.TheStillAuth?.isAuthenticated);
  };

  const redirectToLogin = bookingData => {
    try {
      sessionStorage.setItem(
        'stillHotelPendingBooking',
        JSON.stringify(bookingData)
      );
    } catch {

    }

    const params = new URLSearchParams({
      returnTo: window.location.href
    });

    window.location.href = `${LOGIN_URL}?${params.toString()}`;
  };

  let confirmationOpener = null;

  const closeConfirmation = (restoreFocus = true) => {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('still-booking-modal-open');

    const opener = confirmationOpener;
    confirmationOpener = null;

    window.setTimeout(() => {
      if (modal.parentNode) modal.remove();
      if (restoreFocus && opener?.isConnected) opener.focus();
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

    try {
      const existing = getBookings();
      const usedTokens = new Set(existing.map(item => item?.bookingToken).filter(Boolean));

      while (usedTokens.has(token)) token = makeToken();
    } catch {

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

    const bookingRecord = {
      ...bookingData,
      bookingToken: bookingIds.token,
      customerBookingId: bookingIds.customerId,
      adminBookingId: bookingIds.adminId,
      status: STATUS.REQUESTED,
      createdAt: new Date().toISOString()
    };

    const persistence = persistBookingRequest(
      bookingRecord,
      bookingIds.customerId
    );

    const whatsappUrl = buildWhatsAppUrl(bookingData, bookingIds.customerId);

    if (!persistence.ok) {
      window.alert(
        'We could not save your booking on this device. The booking request was not saved. Please try again.'
      );
      return false;
    }

    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    modal.querySelector('.still-booking-receipt')?.classList.add('is-success');

    const receipt = modal.querySelector('.still-booking-receipt');
    if (!receipt) return false;

    notifyAdmin({
      type: 'booking',
      booking: bookingRecord,
      status: 'pending',
      title: 'Booking request received',
      message: 'Customer ' + bookingIds.customerId + ' submitted a booking request for ' + (bookingData.room || 'a room selection') + '.'
    });

    emitBookingUpdate({
      reason: 'booking-requested',
      customerBookingId: bookingIds.customerId,
      adminBookingId: bookingIds.adminId
    });

    receipt.innerHTML = `
      <div class="still-booking-success">
        <div class="still-booking-receipt-head">
          <p class="eyebrow">The Still Hotel / Booking request received</p>
          <span>THANK YOU</span>
        </div>

        <div class="still-booking-success-mark" aria-hidden="true">✓</div>

        <div class="still-booking-success-copy">
          <p class="still-booking-receipt-kicker">Your stay is noted</p>
          <h2>Your request<br><em>is received.</em></h2>

          <p class="still-booking-success-message">
            Thank you for choosing The Still Hotel. Your booking request has been recorded.
            We will confirm availability, final rates and stay conditions with you directly
            before the reservation is finalized.
          </p>
        </div>

        <div class="still-booking-id-block">
          <span>CUSTOMER BOOKING ID</span>
          <strong>${escapeHtml(bookingIds.customerId)}</strong>
        </div>

        <div class="still-booking-success-note">
          <p>
            Keep this Customer Booking ID for reference. It does not confirm availability
            or the final reservation until the hotel confirms your stay.
          </p>
          <p>Please keep this Customer Booking ID for reference while we confirm your stay.</p>
        </div>

        <div class="still-booking-success-actions">
          ${whatsappUrl ? '<a class="button button-dark still-booking-whatsapp" href="' + escapeHtml(whatsappUrl) + '" target="_blank" rel="noopener">Open WhatsApp <span>↗</span></a>' : ''}
          <button
            class="button ${whatsappUrl ? 'button-outline-dark' : 'button-dark'} still-booking-understand"
            type="button"
            data-booking-understand>
            Done
          </button>
        </div>
      </div>
    `;

    receipt.querySelector('[data-booking-understand]')?.addEventListener(
      'click',
      () => {
        closeConfirmation();
        window.dispatchEvent(new CustomEvent('still:booking-requested', {
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

  const buildWhatsAppUrl = (bookingData, customerBookingId) => {
    const number = String(window.STILL_CONTACT?.whatsappNumber || '').replace(/\D/g, '');
    if (!number) return '';

    const nights = getNights(bookingData.checkin, bookingData.checkout);
    const lines = [
      'Hello, I would like to request a stay at The Still Hotel.',
      '',
      bookingData.room ? 'Room: ' + bookingData.room : '',
      bookingData.bookedUnder ? 'Booked under: ' + bookingData.bookedUnder : '',
      bookingData.checkin ? 'Check-in: ' + formatDate(bookingData.checkin) : '',
      bookingData.checkout ? 'Check-out: ' + formatDate(bookingData.checkout) : '',
      'Guests: ' + (bookingData.guests || '2'),
      nights ? 'Nights: ' + nights : '',
      'Customer Booking ID: ' + customerBookingId,
      '',
      'Please confirm availability, final rate and booking conditions.'
    ].filter(Boolean);

    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'));
  };

  const showConfirmation = bookingData => {
    confirmationOpener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

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
              <span>Booked under</span>
              <strong>${escapeHtml(bookingData.bookedUnder || '—')}</strong>
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
              Continuing records this request on this device and opens WhatsApp so you can send the request directly to The Still Hotel.
              No payment is taken at this stage.
            </p>
            <p>
              By selecting Send request, you acknowledge that final availability,
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
            Send request
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
        const dateCheck = validateBookingDates(bookingData.checkin, bookingData.checkout);
        if (!dateCheck.valid) {
          window.alert(dateCheck.message);
          return;
        }

        if (bookingData.roomId && window.TheStillRoomInventory?.getAvailability) {
          const availability = window.TheStillRoomInventory.getAvailability(
            bookingData.roomId,
            bookingData.checkin,
            bookingData.checkout
          );

          if (availability && availability.available <= 0) {
            window.alert(
              'This room type is no longer available for the selected dates. Please choose different dates.'
            );
            return;
          }
        }

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
      roomId: bookingData?.roomId || '',
      room: bookingData?.room || '',
      bookedUnder: bookingData?.bookedUnder || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2',
      price: bookingData?.price || ''
    };

    const dateCheck = validateBookingDates(data.checkin, data.checkout);
    if (!dateCheck.valid) {
      window.alert(dateCheck.message);
      return;
    }

    if (data.roomId && window.TheStillRoomInventory?.getAvailability) {
      const availability = window.TheStillRoomInventory.getAvailability(
        data.roomId,
        data.checkin,
        data.checkout
      );

      if (availability && availability.available <= 0) {
        window.alert(
          'This room type is not available for the selected dates. Please choose different dates.'
        );
        return;
      }
    }

    if (!BYPASS_LOGIN && !hasSession()) {
      redirectToLogin(data);
      return;
    }

    showConfirmation(data);
  };

  expireOverdueBookings();
  window.setInterval(expireOverdueBookings, 60 * 1000);

  window.addEventListener('storage', event => {
    if (event.key === STORAGE.bookings || event.key === STORAGE.notifications) {
      expireOverdueBookings();
    }
  });

  window.TheStillBooking = {
    start: startBooking,
    getBookings: expireOverdueBookings,
    getNotifications,
    requestCancellation,
    resolveCancellation,
    deleteHistory,
    expireOverdueBookings,
    status: STATUS,
    validateBookingDates,
    config: {
      maxStayNights: MAX_STAY_NIGHTS,
      bypassLogin: BYPASS_LOGIN,
      bypassAdminCancellation: BYPASS_ADMIN_CANCELLATION,
      loginUrl: LOGIN_URL
    }
  };
})();

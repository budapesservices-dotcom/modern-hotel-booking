

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


  const STORAGE={bookings:'stillHotelBookings',notifications:'stillHotelAdminNotifications',current:'stillHotelCurrentBookingId'};
  const STATUS={CONFIRMED:'confirmed',CANCELLATION_PENDING:'cancellation_pending',CANCELLED:'cancelled',EXPIRED:'expired'};
  const readJson=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'');return value??fallback;}catch{return fallback;}};
  const getBookings=()=>{const value=readJson(STORAGE.bookings,[]);return Array.isArray(value)?value:[];};
  const saveBookings=bookings=>{try{localStorage.setItem(STORAGE.bookings,JSON.stringify(bookings));return true;}catch{return false;}};
  const getNotifications=()=>{const value=readJson(STORAGE.notifications,[]);return Array.isArray(value)?value:[];};
  const saveNotifications=notifications=>{try{localStorage.setItem(STORAGE.notifications,JSON.stringify(notifications));return true;}catch{return false;}};
  const emitBookingUpdate=detail=>window.dispatchEvent(new CustomEvent('still:booking-updated',{detail:detail||{}}));
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
      const canExpire=booking.status===STATUS.CONFIRMED||booking.status===STATUS.CANCELLATION_PENDING;
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
    if(booking.status!==STATUS.CONFIRMED)return{ok:false,reason:'not-cancellable',booking};
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

    const updated={...booking,status:STATUS.CANCELLATION_PENDING,cancellationRequestId:requestId,cancellationRequestedAt:requestedAt};
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
    const updated={...booking,status:approved?STATUS.CANCELLED:STATUS.CONFIRMED,cancellationConfirmedAt:approved?new Date().toISOString():null,cancellationRejectedAt:approved?null:new Date().toISOString()};
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

    try {
      const bookingRecord = {
        ...bookingData,
        bookingToken: bookingIds.token,
        customerBookingId: bookingIds.customerId,
        adminBookingId: bookingIds.adminId,
        status: STATUS.CONFIRMED,
        createdAt: new Date().toISOString()
      };

      saveBookings([bookingRecord, ...getBookings()].slice(0, 25));

      localStorage.setItem(STORAGE.current, bookingIds.customerId);
      emitBookingUpdate({
        reason: 'booking-created',
        customerBookingId: bookingIds.customerId,
        adminBookingId: bookingIds.adminId
      });
    } catch {

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
            Understood
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
        const contact = window.STILL_CONTACT || {};
        const number = String(contact.whatsappNumber || '').replace(/\D/g, '');
        const currency = String.fromCharCode(36);
        const summary = [
          'Hello The Still Hotel,',
          '',
          'I would like to continue this booking request.',
          bookingData.room ? 'Room: ' + bookingData.room : null,
          bookingData.guests ? 'Guests: ' + bookingData.guests : null,
          bookingData.checkin ? 'Check-in: ' + formatDate(bookingData.checkin) : null,
          bookingData.checkout ? 'Check-out: ' + formatDate(bookingData.checkout) : null,
          bookingData.price ? 'Nightly rate: ' + currency + bookingData.price : null
        ].filter(Boolean).join('\\n');

        if (number) {
          const whatsappUrl = 'https://wa.me/' + number + '?text=' + encodeURIComponent(summary);
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
      room: bookingData?.room || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2',
      price: bookingData?.price || ''
    };

    
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
    config: {
      bypassLogin: BYPASS_LOGIN,
      bypassAdminCancellation: BYPASS_ADMIN_CANCELLATION,
      loginUrl: LOGIN_URL
    }
  };
})();
 + bookingData.price : null
        ].filter(Boolean).join('\n');

        if (number) {
          const whatsappUrl = 'https://wa.me/' + number + '?text=' + encodeURIComponent(summary);
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
      room: bookingData?.room || '',
      checkin: bookingData?.checkin || '',
      checkout: bookingData?.checkout || '',
      guests: bookingData?.guests || '2',
      price: bookingData?.price || ''
    };

    
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
    config: {
      bypassLogin: BYPASS_LOGIN,
      bypassAdminCancellation: BYPASS_ADMIN_CANCELLATION,
      loginUrl: LOGIN_URL
    }
  };
})();

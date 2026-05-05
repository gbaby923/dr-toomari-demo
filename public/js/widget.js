/* ============================================================
   TOOMARI PEDIATRICS — AI WIDGET (MAYA)
   ============================================================ */

(function () {
  'use strict';

  /* ---- DEMO INTERNAL CLOCK ----
     The demo is anchored at Tuesday, May 5, 2026 at 10:00 AM.
     The clock advances in real time from that anchor so live
     status, current time display, and same-day slots all stay
     internally consistent for the demo.
  */
  const DEMO_ANCHOR_FIXED = new Date(2026, 4, 5, 10, 0, 0).getTime(); // May=4 (zero-indexed)
  const DEMO_ANCHOR_REAL  = Date.now();
  function clinicNow() {
    return new Date(DEMO_ANCHOR_FIXED + (Date.now() - DEMO_ANCHOR_REAL));
  }

  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function isClinicOpenAt(d) {
    const day = d.getDay(); // 0 Sun ... 6 Sat
    if (day === 0 || day === 6) return false; // weekend
    const minutes = d.getHours() * 60 + d.getMinutes();
    return minutes >= 9 * 60 && minutes < 17 * 60; // 9:00–17:00
  }

  function nextOpeningAfter(d) {
    const next = new Date(d.getTime());
    // If today before 9am on a weekday, next is today 9am
    const day = next.getDay();
    const minutes = next.getHours() * 60 + next.getMinutes();
    if (day >= 1 && day <= 5 && minutes < 9 * 60) {
      next.setHours(9, 0, 0, 0);
      return next;
    }
    // otherwise advance day-by-day to next weekday morning
    do {
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
    } while (next.getDay() === 0 || next.getDay() === 6);
    return next;
  }

  function fmtTime(d) {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isoDateOnly(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function clinicContext() {
    const now = clinicNow();
    const open = isClinicOpenAt(now);
    return {
      localTime: fmtDate(now) + ' ' + fmtTime(now),
      dayOfWeek: DAY_NAMES[now.getDay()],
      isOpen: open,
      nextOpen: open ? null : (fmtDate(nextOpeningAfter(now)) + ' 9:00 AM'),
    };
  }

  /* ---- DOM ---- */
  const bubble       = document.getElementById('widgetBubble');
  const panel        = document.getElementById('widgetPanel');
  const closeBtn     = document.getElementById('widgetClose');
  const messagesEl   = document.getElementById('widgetMessages');
  const inputEl      = document.getElementById('widgetInput');
  const sendBtn      = document.getElementById('widgetSend');
  const quickReplies = document.getElementById('quickReplies');
  const floatingMenu = document.getElementById('widgetFloatingMenu');
  const clockEl      = document.getElementById('widgetClock');
  const statusTextEl = document.getElementById('widgetStatusText');
  const statusDotEl  = document.getElementById('widgetStatusDot');

  let isOpen       = false;
  let isWaiting    = false;
  let conversationHistory = [];

  /* ---- LIVE STATUS / CLOCK ---- */
  function refreshStatusUI() {
    const now = clinicNow();
    const open = isClinicOpenAt(now);
    if (clockEl) clockEl.textContent = fmtTime(now);
    if (statusTextEl) {
      statusTextEl.textContent = open
        ? 'Open now · Maya is online'
        : 'Closed · Reopens ' + fmtDate(nextOpeningAfter(now)) + ' 9:00 AM';
    }
    if (statusDotEl) {
      statusDotEl.classList.toggle('status-dot-closed', !open);
    }
  }
  refreshStatusUI();
  setInterval(refreshStatusUI, 30 * 1000);

  /* ---- FLOATING MENU ---- */
  // Show once per session, 2.5s after page load
  try {
    if (!sessionStorage.getItem('mayaMenuShown')) {
      setTimeout(function () {
        if (!isOpen && floatingMenu) floatingMenu.classList.remove('hidden');
        try { sessionStorage.setItem('mayaMenuShown', '1'); } catch (e) {}
      }, 2500);
    }
  } catch (e) {
    setTimeout(function () {
      if (!isOpen && floatingMenu) floatingMenu.classList.remove('hidden');
    }, 2500);
  }

  if (floatingMenu) {
    floatingMenu.querySelectorAll('.floating-prompt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const msg = btn.getAttribute('data-msg');
        openWidget();
        sendMessage(msg);
      });
    });
  }


  /* ---- OPEN / CLOSE ---- */
  function openWidget() {
    isOpen = true;
    if (floatingMenu) floatingMenu.classList.add('hidden');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    bubble.classList.add('open');
    bubble.setAttribute('aria-label', 'Close chat');
    setTimeout(function () { inputEl.focus(); }, 350);
    scrollToBottom();
  }

  function closeWidget() {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    bubble.classList.remove('open');
    bubble.setAttribute('aria-label', 'Chat with Maya');
  }

  bubble.addEventListener('click', function () {
    if (isOpen) closeWidget(); else openWidget();
  });

  closeBtn.addEventListener('click', closeWidget);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeWidget();
  });


  /* ---- MESSAGES ---- */
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(text, role) {
    const msgEl = document.createElement('div');
    msgEl.className = 'msg msg-' + (role === 'user' ? 'user' : 'bot');

    const inner = document.createElement('div');
    inner.className = 'msg-bubble';
    inner.innerHTML = sanitize(text).replace(/\n/g, '<br>');

    msgEl.appendChild(inner);
    messagesEl.appendChild(msgEl);
    scrollToBottom();
    return msgEl;
  }

  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'msg msg-bot';
    el.id = 'typingIndicator';
    el.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }


  /* ---- QUICK REPLIES ---- */
  quickReplies.querySelectorAll('.quick-reply').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const msg = btn.getAttribute('data-msg');
      quickReplies.classList.add('hidden');
      sendMessage(msg);
    });
  });


  /* ---- SEND MESSAGE ---- */
  async function sendMessage(text) {
    const trimmed = (text || inputEl.value).trim();
    if (!trimmed || isWaiting) return;

    inputEl.value = '';
    quickReplies.classList.add('hidden');
    appendMessage(trimmed, 'user');

    conversationHistory.push({ role: 'user', content: trimmed });

    isWaiting = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          clinicContext: clinicContext(),
        }),
      });

      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      const data = await response.json();
      const reply = data.content || "I'm sorry, I didn't get a response. Please try again or call our office at (818) 205-1666.";

      removeTyping();

      let cleanReply = reply;
      let showForm = false;
      let showSameDay = false;

      if (cleanReply.includes('[SHOW_BOOKING_FORM]')) {
        cleanReply = cleanReply.replace('[SHOW_BOOKING_FORM]', '').trim();
        showForm = true;
      }
      if (cleanReply.includes('[SHOW_SAMEDAY_OPTIONS]')) {
        cleanReply = cleanReply.replace('[SHOW_SAMEDAY_OPTIONS]', '').trim();
        showSameDay = true;
      }

      if (cleanReply) {
        appendMessage(cleanReply, 'bot');
      }
      conversationHistory.push({ role: 'assistant', content: cleanReply });

      if (showSameDay) {
        appendSameDayOptions();
      } else if (showForm) {
        appendInlineForm();
      }

    } catch (err) {
      removeTyping();
      appendMessage(
        "I'm having trouble connecting right now. Please call our office directly at (818) 205-1666 — we're happy to help!",
        'bot'
      );
    } finally {
      isWaiting = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  /* ---- SAME-DAY TIME SLOTS ---- */
  function generateSameDaySlots() {
    const now = clinicNow();
    const slots = [];
    if (!isClinicOpenAt(now)) return slots;

    // Round up to next 30-min mark, +30 min lead time, then 30-min cadence until 4:30 PM
    const lead = new Date(now.getTime());
    lead.setSeconds(0, 0);
    lead.setMinutes(lead.getMinutes() + 30);
    let mins = lead.getMinutes();
    const remainder = mins % 30;
    if (remainder !== 0) {
      lead.setMinutes(mins + (30 - remainder));
    }

    const endOfDay = new Date(now.getTime());
    endOfDay.setHours(16, 30, 0, 0); // last slot 4:30 PM

    let cursor = new Date(lead.getTime());
    while (cursor <= endOfDay && slots.length < 5) {
      slots.push(new Date(cursor.getTime()));
      cursor.setMinutes(cursor.getMinutes() + 30);
    }
    return slots;
  }

  function appendSameDayOptions() {
    const wrapperId = 'sameday_' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.className = 'sameday-wrapper';
    wrapper.id = wrapperId;

    const slots = generateSameDaySlots();

    if (!slots.length) {
      wrapper.innerHTML = `
        <div class="sameday-card">
          <div class="sameday-title">Same-Day Visits</div>
          <p style="margin:0 0 8px; font-size:0.82rem; color:#374151;">
            We're currently outside office hours. I'd be happy to set up the next available appointment for you.
          </p>
        </div>
      `;
      messagesEl.appendChild(wrapper);
      scrollToBottom();
      return;
    }

    const now = clinicNow();
    const slotButtons = slots.map(function (s) {
      return `<button type="button" class="sameday-slot" data-time="${fmtTime(s)}">${fmtTime(s)}</button>`;
    }).join('');

    wrapper.innerHTML = `
      <div class="sameday-card">
        <div class="sameday-header">
          <div>
            <div class="sameday-title">📅 Same-Day Sick Visits</div>
            <div class="sameday-sub">${fmtDate(now)} · pick a time</div>
          </div>
          <div class="sameday-pill">Open now</div>
        </div>
        <div class="sameday-slots">${slotButtons}</div>
        <div class="sameday-foot">Tap a time to send your request — we'll confirm within minutes.</div>
      </div>
    `;
    messagesEl.appendChild(wrapper);
    scrollToBottom();

    wrapper.querySelectorAll('.sameday-slot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const chosen = btn.getAttribute('data-time');
        wrapper.querySelectorAll('.sameday-slot').forEach(function (b) { b.classList.remove('selected'); b.disabled = true; });
        btn.classList.add('selected');
        appendInlineForm({ visitType: 'Sick visit', date: isoDateOnly(clinicNow()), time: chosen, sameDay: true });
      });
    });
  }

  /* ---- INLINE BOOKING FORM ---- */
  function appendInlineForm(prefill) {
    prefill = prefill || {};
    const formId = 'inlineForm_' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-inline-form-wrapper';

    const todayIso = isoDateOnly(clinicNow());
    const dateValue = prefill.date || todayIso;

    const visitOptions = ['Well-child visit','Sick visit','Vaccine visit','Follow-up','Forms/school physical','Other']
      .map(function (v) {
        const sel = (prefill.visitType === v) ? ' selected' : '';
        return `<option${sel}>${v}</option>`;
      }).join('');

    const timeRow = prefill.time
      ? `<label>Requested Time</label>
         <input type="text" value="${prefill.time}" readonly aria-readonly="true" style="background:#EEF5FF; font-weight:700; color:#1B4F8A;">`
      : '';

    const heading = prefill.sameDay
      ? `<h4>Confirm Same-Day Visit</h4><p class="form-lead">Today · ${prefill.time || ''}</p>`
      : `<h4>Request an Appointment</h4>`;

    wrapper.innerHTML = `
      <div class="chat-inline-form">
        ${heading}
        <form id="${formId}">
          <label>Parent/Guardian Name *</label>
          <input type="text" required autocomplete="off">

          <label>Phone Number *</label>
          <input type="tel" required autocomplete="off">

          <label>What type of visit would you like to request? *</label>
          <select required>
            <option value="">Select...</option>
            ${visitOptions}
          </select>

          <label>Preferred Date *</label>
          <input type="date" required autocomplete="off" value="${dateValue}" min="${todayIso}">

          ${timeRow}

          <label>Preferred Location *</label>
          <select required>
            <option value="">Select...</option>
            <option>Van Nuys</option>
            <option>Encino</option>
            <option>Either</option>
          </select>

          <label>Insurance *</label>
          <select required>
            <option value="">Select...</option>
            <option>Medi-Cal</option>
            <option>HMO</option>
            <option>PPO</option>
            <option>Cash / Self-Pay</option>
            <option>Other</option>
          </select>

          <button type="submit" class="btn btn-primary">${prefill.sameDay ? 'Confirm Same-Day Visit' : 'Submit Request'}</button>
        </form>
      </div>
    `;

    messagesEl.appendChild(wrapper);
    scrollToBottom();

    const formEl = document.getElementById(formId);
    formEl.addEventListener('submit', function(e) {
      e.preventDefault();
      const successCopy = prefill.sameDay
        ? `We've got your same-day request${prefill.time ? ' for ' + prefill.time : ''}. Our team will call to confirm within 15 minutes.`
        : 'Thank you. Our team will contact you within 1 business day.';
      wrapper.innerHTML = `
        <div class="chat-form-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4ade80"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <h4 style="margin: 0 0 8px; color: #065f46; font-family: 'Nunito', sans-serif; font-weight: 800;">Request Received!</h4>
          <p style="margin:0;">${successCopy}</p>
        </div>
      `;
      scrollToBottom();
    });
  }

  sendBtn.addEventListener('click', function () { sendMessage(); });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

})();

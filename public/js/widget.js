/* ============================================================
   TOOMARI PEDIATRICS — AI WIDGET (MAYA)
   ============================================================ */

(function () {
  'use strict';

  const bubble       = document.getElementById('widgetBubble');
  const panel        = document.getElementById('widgetPanel');
  const closeBtn     = document.getElementById('widgetClose');
  const messagesEl   = document.getElementById('widgetMessages');
  const inputEl      = document.getElementById('widgetInput');
  const sendBtn      = document.getElementById('widgetSend');
  const quickReplies = document.getElementById('quickReplies');
  const floatingMenu = document.getElementById('widgetFloatingMenu');

  let isOpen       = false;
  let isWaiting    = false;
  let conversationHistory = [];


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
    // sessionStorage unavailable — show anyway
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

  // Close on Escape
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

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = sanitize(text).replace(/\n/g, '<br>');

    msgEl.appendChild(bubble);
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
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      const data = await response.json();
      const reply = data.content || "I'm sorry, I didn't get a response. Please try again or call our office at (818) 205-1666.";

      removeTyping();
      
      let cleanReply = reply;
      let showForm = false;
      if (reply.includes('[SHOW_BOOKING_FORM]')) {
        cleanReply = reply.replace('[SHOW_BOOKING_FORM]', '').trim();
        showForm = true;
      }

      if (cleanReply) {
        appendMessage(cleanReply, 'bot');
      }
      conversationHistory.push({ role: 'assistant', content: cleanReply });

      if (showForm) {
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

  function appendInlineForm() {
    const formId = 'inlineForm_' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-inline-form-wrapper';
    wrapper.innerHTML = `
      <div class="chat-inline-form">
        <h4>Request an Appointment</h4>
        <form id="${formId}">
          <label>Parent/Guardian Name *</label>
          <input type="text" required autocomplete="off">
          
          <label>Phone Number *</label>
          <input type="tel" required autocomplete="off">
          
          <label>What type of visit would you like to request? *</label>
          <select required>
            <option value="">Select...</option>
            <option>Well-child visit</option>
            <option>Sick visit</option>
            <option>Vaccine visit</option>
            <option>Follow-up</option>
            <option>Forms/school physical</option>
            <option>Other</option>
          </select>
          
          <label>Preferred Date *</label>
          <input type="date" required autocomplete="off">

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
          
          <button type="submit" class="btn btn-primary">Submit Request</button>
        </form>
      </div>
    `;
    
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    
    const formEl = document.getElementById(formId);
    formEl.addEventListener('submit', function(e) {
      e.preventDefault();
      wrapper.innerHTML = `
        <div class="chat-form-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4ade80"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <h4 style="margin: 0 0 8px; color: #065f46; font-family: 'Nunito', sans-serif; font-weight: 800;">Request Received!</h4>
          <p style="margin:0;">Thank you. Our team will contact you within 1 business day.</p>
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

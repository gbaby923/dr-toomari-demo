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
  const tooltip      = document.getElementById('widgetTooltip');
  const tooltipClose = document.getElementById('tooltipClose');

  let isOpen       = false;
  let isWaiting    = false;
  let conversationHistory = [];
  let tooltipHideTimer = null;


  /* ---- TOOLTIP / GREETING POPUP ---- */
  function showTooltip() {
    if (!tooltip || isOpen) return;
    tooltip.classList.add('visible');
    // Auto-hide after 8 seconds
    tooltipHideTimer = setTimeout(hideTooltip, 8000);
  }
  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('visible');
    if (tooltipHideTimer) {
      clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }
  }
  // Show once per session, 2.5s after page load
  try {
    if (!sessionStorage.getItem('mayaTooltipShown')) {
      setTimeout(function () {
        showTooltip();
        try { sessionStorage.setItem('mayaTooltipShown', '1'); } catch (e) {}
      }, 2500);
    }
  } catch (e) {
    // sessionStorage unavailable — show anyway
    setTimeout(showTooltip, 2500);
  }
  // Click tooltip body (not close button) opens widget
  if (tooltip) {
    tooltip.addEventListener('click', function (e) {
      if (e.target.closest('.tooltip-close')) return;
      hideTooltip();
      openWidget();
    });
  }
  if (tooltipClose) {
    tooltipClose.addEventListener('click', function (e) {
      e.stopPropagation();
      hideTooltip();
    });
  }


  /* ---- OPEN / CLOSE ---- */
  function openWidget() {
    isOpen = true;
    hideTooltip();
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
      appendMessage(reply, 'bot');
      conversationHistory.push({ role: 'assistant', content: reply });

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

  sendBtn.addEventListener('click', function () { sendMessage(); });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

})();

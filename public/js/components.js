/* ============================================================
   TOOMARI PEDIATRICS — SHARED COMPONENTS
   Injects nav, footer, and widget into every page.
   ============================================================ */

(function () {
  'use strict';

  // ---- Detect active page ----
  const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  const pageKey = path === '' || path === 'index' ? 'home' : path;

  const isActive = (key) =>
    (key === 'home' && (pageKey === 'home' || pageKey === 'index')) || pageKey === key
      ? ' active'
      : '';

  // ---- HEADER ----
  const headerHTML = `
    <header class="site-header" id="navbar">
      <div class="container nav-inner">
        <a href="index.html" class="logo logo-img" aria-label="Toomari Pediatrics — Home">
          <img src="images/logo.png" srcset="images/logo.png 1x, images/logo@2x.png 2x" alt="Toomari Pediatrics" class="logo-image">
        </a>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="index.html" class="nav-link${isActive('home')}">Home</a>
          <a href="services.html" class="nav-link${isActive('services')}">Services</a>
          <a href="about.html" class="nav-link${isActive('about')}">About</a>
          <a href="patient-info.html" class="nav-link${isActive('patient-info')}">Patient Info</a>
          <a href="contact.html" class="nav-link${isActive('contact')}">Contact</a>
        </nav>
        <a href="contact.html" class="btn btn-primary nav-cta">Book Appointment</a>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="mobile-nav" id="mobileNav" aria-hidden="true">
        <a href="index.html" class="mob-link${isActive('home')}">Home</a>
        <a href="services.html" class="mob-link${isActive('services')}">Services</a>
        <a href="about.html" class="mob-link${isActive('about')}">About</a>
        <a href="patient-info.html" class="mob-link${isActive('patient-info')}">Patient Info</a>
        <a href="contact.html" class="mob-link${isActive('contact')}">Contact</a>
        <a href="contact.html" class="btn btn-primary mob-book">Book an Appointment</a>
      </div>
    </header>
  `;

  // ---- FOOTER ----
  const footerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo logo-img logo-img-footer" aria-label="Toomari Pediatrics — Home">
            <img src="images/logo.png" srcset="images/logo.png 1x, images/logo@2x.png 2x" alt="Toomari Pediatrics" class="logo-image">
          </a>
          <p class="footer-tagline">Compassionate pediatric care for every child, every stage — in the heart of Sherman Oaks.</p>
          <p class="footer-address">12345 Ventura Blvd, Suite 200<br>Sherman Oaks, CA 91423<br>(818) 555-0192</p>
        </div>
        <div class="footer-col">
          <h4>Our Practice</h4>
          <a href="services.html">Our Services</a>
          <a href="about.html">About Dr. Toomari</a>
          <a href="patient-info.html">Patient Resources</a>
          <a href="contact.html">Contact &amp; Hours</a>
        </div>
        <div class="footer-col">
          <h4>Patient Info</h4>
          <a href="patient-info.html#forms">New Patient Forms</a>
          <a href="patient-info.html#portal">Patient Portal</a>
          <a href="patient-info.html#vaccines">Vaccine Schedule</a>
          <a href="patient-info.html#after-hours">After-Hours Line</a>
          <a href="patient-info.html#insurance">Insurance &amp; Billing</a>
        </div>
        <div class="footer-col">
          <h4>Get in Touch</h4>
          <a href="tel:+18185550192">(818) 555-0192</a>
          <a href="contact.html">Book Appointment</a>
          <a href="patient-info.html#portal">Patient Portal Login</a>
          <a href="services.html#telehealth">Telehealth Visit</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>&copy; 2024 Toomari Pediatrics. All rights reserved.</p>
          <p class="footer-powered">Website by <a href="https://mountstudio.ai" target="_blank" rel="noopener">MOUNT Studio</a></p>
        </div>
      </div>
    </footer>
  `;

  // ---- CHAT WIDGET ----
  const widgetHTML = `
    <div id="chat-widget">
      <button class="widget-bubble" id="widgetBubble" aria-label="Chat with Maya">
        <svg class="bubble-icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="white"/></svg>
        <svg class="bubble-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
      </button>
      <div class="widget-panel" id="widgetPanel" aria-hidden="true">
        <div class="widget-header">
          <div class="widget-header-info">
            <div class="widget-avatar">M</div>
            <div>
              <div class="widget-title">Toomari Pediatrics</div>
              <div class="widget-status">
                <span class="status-dot"></span>
                Maya is online
              </div>
            </div>
          </div>
          <button class="widget-close" id="widgetClose" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="widget-messages" id="widgetMessages">
          <div class="msg msg-bot">
            <div class="msg-bubble">
              Hi! I'm Maya, the virtual receptionist at Toomari Pediatrics. 👋<br><br>
              How can I help you and your family today?
            </div>
          </div>
        </div>
        <div class="quick-replies" id="quickReplies">
          <button class="quick-reply" data-msg="I'd like to book an appointment">📅 Book an Appointment</button>
          <button class="quick-reply" data-msg="What are your office hours and location?">📍 Office Hours &amp; Location</button>
          <button class="quick-reply" data-msg="What should I bring to my child's first appointment?">📋 What to Bring</button>
          <button class="quick-reply" data-msg="I have questions about vaccinations">💉 Vaccination Questions</button>
          <button class="quick-reply" data-msg="My child is sick — what should I do?">🤒 Sick Visit Info</button>
        </div>
        <div class="widget-input-area">
          <input type="text" class="widget-input" id="widgetInput" placeholder="Type a message..." autocomplete="off" aria-label="Message">
          <button class="widget-send" id="widgetSend" aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="widget-footer">
          Powered by <a href="https://mountstudio.ai" target="_blank" rel="noopener">MOUNT Studio</a>
        </div>
      </div>
    </div>
  `;

  // ---- MOUNT ----
  function mount(id, html) {
    const el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  mount('site-header-mount', headerHTML);
  mount('site-footer-mount', footerHTML);
  mount('chat-widget-mount', widgetHTML);
})();

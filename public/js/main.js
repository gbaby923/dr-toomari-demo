/* ============================================================
   TOOMARI PEDIATRICS — MAIN PAGE JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ---- STICKY NAV ---- */
  const navbar = document.getElementById('navbar');
  function handleScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();


  /* ---- MOBILE HAMBURGER ---- */
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobileNav');

  hamburger.addEventListener('click', function () {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close mobile nav on link click
  document.querySelectorAll('.mob-link, .mob-book').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });


  /* ---- SMOOTH SCROLL FOR NAV LINKS ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height'), 10) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });


  /* ---- SCROLL REVEAL ---- */
  const animatables = document.querySelectorAll(
    '.service-card, .why-card, .insurance-item, .resource-card, .about-grid, .contact-grid'
  );
  animatables.forEach(function (el) {
    el.classList.add('fade-up');
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  animatables.forEach(function (el) { observer.observe(el); });


  /* ---- STAGGER CARDS ---- */
  document.querySelectorAll('.services-grid, .why-grid, .insurance-grid, .resources-grid')
    .forEach(function (grid) {
      Array.from(grid.children).forEach(function (child, index) {
        child.style.transitionDelay = (index * 60) + 'ms';
      });
    });

})();

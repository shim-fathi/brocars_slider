/* =========================================
   BRO CARS — Main JavaScript
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar Scroll & Active State ---- */
  const navbar = document.querySelector('.navbar');
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ---- Mobile Menu ---- */
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu?.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      navMenu?.classList.remove('open');
    });
  });

  /* ---- Scroll Reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = (i * 0.08) + 's';
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* ---- Contact Form Validation ---- */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const validate = (field) => {
      const group = field.closest('.form-group');
      if (!group) return true;
      const val = field.value.trim();
      let valid = true;

      if (field.required && !val) valid = false;
      if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) valid = false;
      if (field.name === 'phone' && val && !/^[\d\s\+\-\(\)]{7,15}$/.test(val)) valid = false;

      group.classList.toggle('error', !valid);
      return valid;
    };

    contactForm.querySelectorAll('input, textarea').forEach(f => {
      f.addEventListener('blur', () => validate(f));
      f.addEventListener('input', () => {
        if (f.closest('.form-group')?.classList.contains('error')) validate(f);
      });
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;
      contactForm.querySelectorAll('input, textarea').forEach(f => {
        if (!validate(f)) allValid = false;
      });

      if (allValid) {
        contactForm.style.opacity = '0';
        contactForm.style.transition = 'opacity 0.4s ease';
        setTimeout(() => {
          contactForm.style.display = 'none';
          const successDiv = document.querySelector('.form-success');
          if (successDiv) {
            successDiv.style.display = 'block';
          }
        }, 400);
      }
    });
  }

  /* ---- Lazy Load Images ---- */
  const lazyImages = document.querySelectorAll('img[data-src]');
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImages.forEach(img => imgObserver.observe(img));

});

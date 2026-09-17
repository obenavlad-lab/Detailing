'use strict';

// Mobile navigation
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Відкрити меню');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

// One-time section reveals; respect motion preferences at any time
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealElements.forEach((element) => {
    element.classList.add('reveal-ready');
    observer.observe(element);
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      observer.disconnect();
      revealElements.forEach((element) => element.classList.add('is-visible'));
    }
  });
  document.addEventListener('focusin', (event) => {
    event.target.closest('.reveal-ready')?.classList.add('is-visible');
  });
}

// Service selection
const serviceSelect = document.querySelector('#service');
document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => { serviceSelect.value = link.dataset.service; });
});

// Accessible demo validation. No backend, storage or simulated submission.
const form = document.querySelector('.booking-form');
const status = document.querySelector('#form-status');
const nameInput = document.querySelector('#name');
const phoneInput = document.querySelector('#phone');
function validateField(field) {
  const value = field.value.trim();
  let message = '';
  if (field === nameInput && value.length < 2) message = 'Введіть ім’я — щонайменше 2 символи.';
  if (field === phoneInput) {
    const digits = value.replace(/\D/g, '');
    const valid = /^[+\d\s().-]+$/.test(value) && (/^0\d{9}$/.test(digits) || /^380\d{9}$/.test(digits));
    if (!valid) message = 'Введіть український номер: +380 та 9 цифр або 10 цифр з 0.';
  }
  field.setAttribute('aria-invalid', String(Boolean(message)));
  document.querySelector(`#${field.id}-error`).textContent = message;
  return !message;
}
[nameInput, phoneInput].forEach((field) => {
  field.addEventListener('blur', () => { if (field.value.trim()) validateField(field); });
  field.addEventListener('input', () => {
    status.textContent = '';
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
  });
});
serviceSelect.addEventListener('change', () => { status.textContent = ''; });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const results = [nameInput, phoneInput].map(validateField);
  if (results.includes(false)) {
    status.textContent = 'Перевірте позначені поля. Заявку не надіслано.';
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  status.textContent = 'Поля заповнено правильно. Це демонстраційна форма: заявку не надіслано, запис не створено. Для реальних заявок потрібно підключити сервіс запису.';
  status.focus();
});

// Footer
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('svg:not(.svg-library)').forEach((icon) => {
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
});

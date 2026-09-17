'use strict';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const header = document.querySelector('#header');
const heroMedia = document.querySelector('.hero-media');
const hero = document.querySelector('.hero');
const burger = document.querySelector('.burger');
const menu = document.querySelector('#mobile-nav');
let scrollFrame = 0;
let heroVisible = true;
let heroHeight = hero.offsetHeight;

// Reveal each element once; content stays visible if JavaScript is unavailable.
const reveals = [...document.querySelectorAll('.reveal')];
document.querySelectorAll('.stagger').forEach(group => {
  [...group.children].forEach((item, index) => item.style.setProperty('--delay', `${index * 100}ms`));
});
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    entry.target.addEventListener('transitionend', () => entry.target.classList.add('settled'), { once: true });
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -20px 0px' });

function configureMotion() {
  if (motion.matches) {
    root.classList.remove('motion-ready');
    revealObserver.disconnect();
    reveals.forEach(el => el.classList.add('visible'));
    heroMedia.style.transform = '';
    heroMedia.style.willChange = '';
  } else {
    root.classList.add('motion-ready');
    reveals.filter(el => !el.classList.contains('visible')).forEach(el => revealObserver.observe(el));
  }
  requestScrollFrame();
}

function updateScroll() {
  scrollFrame = 0;
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 24);
  if (!motion.matches && heroVisible && !document.hidden) {
    heroMedia.style.transform = `translate3d(0,${Math.min(y, heroHeight) * .12}px,0)`;
  }
}
function requestScrollFrame() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  heroMedia.style.willChange = heroVisible && !motion.matches ? 'transform' : '';
  requestScrollFrame();
}).observe(hero);
window.addEventListener('scroll', requestScrollFrame, { passive: true });
window.addEventListener('resize', () => { heroHeight = hero.offsetHeight; requestScrollFrame(); }, { passive: true });
document.addEventListener('visibilitychange', () => {
  root.classList.toggle('animations-paused', document.hidden);
  if (document.hidden && scrollFrame) { cancelAnimationFrame(scrollFrame); scrollFrame = 0; }
  else requestScrollFrame();
});
motion.addEventListener('change', configureMotion);
configureMotion();

function setMenu(open, restoreFocus = false) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  menu.classList.toggle('open', open);
  menu.inert = !open;
  if (restoreFocus) burger.focus();
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  const target = document.querySelector(event.target.closest('a').hash);
  setMenu(false);
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false, menu.classList.contains('open')); });
document.addEventListener('click', event => { if (!header.contains(event.target) && menu.classList.contains('open')) setMenu(false); });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const activeSections = new Set();
// A shared observer selects the section crossing the upper viewing band.
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting ? activeSections.add(entry.target.id) : activeSections.delete(entry.target.id));
  const current = sections.find(section => activeSections.has(section.id))?.id;
  navLinks.forEach(link => {
    if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-15% 0px -55% 0px' });
sections.forEach(section => navObserver.observe(section));

document.querySelectorAll('.faq-item button').forEach(button => {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.closest('.faq-item').classList.toggle('open', open);
    document.getElementById(button.getAttribute('aria-controls')).inert = !open;
  });
});

const form = document.querySelector('#contact-form');
const submit = form.querySelector('[type=submit]');
const status = document.querySelector('#form-status');
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#service').value = link.dataset.service;
  resetSuccess();
}));
function resetSuccess() {
  submit.classList.remove('complete');
  submit.querySelector('.submit-text').textContent = 'Перевірити заявку';
  status.textContent = '';
}
function fieldError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  document.getElementById(`${input.id}-error`).textContent = message;
  if (message && !motion.matches) {
    field.classList.remove('shake');
    requestAnimationFrame(() => field.classList.add('shake'));
  }
}
form.addEventListener('input', event => {
  resetSuccess();
  if (['name', 'phone'].includes(event.target.id)) fieldError(event.target, '');
});
form.addEventListener('change', resetSuccess);
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = form.elements.name;
  const phone = form.elements.phone;
  const digits = phone.value.replace(/\D/g, '');
  const nameError = name.value.trim().length < 2 ? 'Вкажіть ім’я: щонайменше 2 символи.' : '';
  const phoneError = !/^[+\d\s()\-]+$/.test(phone.value) || digits.length < 10 || digits.length > 15 ? 'Вкажіть коректний номер: від 10 до 15 цифр.' : '';
  fieldError(name, nameError);
  fieldError(phone, phoneError);
  if (nameError || phoneError) { resetSuccess(); (nameError ? name : phone).focus(); return; }
  submit.classList.add('complete');
  submit.querySelector('.submit-text').textContent = 'Заявку підготовлено';
  status.textContent = 'Усе заповнено правильно. Це демоперевірка — заявку не надіслано.';
});

const floating = document.querySelector('.floating-contact');
new IntersectionObserver(([entry]) => {
  floating.classList.toggle('at-contact', entry.isIntersecting);
  floating.inert = entry.isIntersecting;
  floating.setAttribute('aria-hidden', String(entry.isIntersecting));
}, { threshold: .1 }).observe(document.querySelector('#contact'));

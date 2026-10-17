const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
  }));
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Preselect a requested pricing package when opening the enquiry form.
const serviceSelect = document.getElementById('service');
document.querySelectorAll('[data-package]').forEach(link => {
  link.addEventListener('click', () => {
    if (serviceSelect) serviceSelect.value = link.dataset.package;
  });
});
// A local file preview cannot receive form messages. Never pretend to submit them.
const inquiryForm = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');
if (inquiryForm && location.protocol === 'file:') {
  inquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = 'Preview only: this form will accept real messages after the website is published on Netlify. No message was sent.';
      formStatus.style.color = '#ffdf92';
    }
  });
}

// Edit the public starter prices in prices.js; no admin account is required.
if (typeof TOBA_STARTING_PRICES !== 'undefined') {
  document.querySelectorAll('[data-price-key]').forEach(block => {
    const value = TOBA_STARTING_PRICES[block.dataset.priceKey];
    const amount = block.querySelector('.price-amount');
    if (amount && Number.isFinite(value) && value >= 0) {
      amount.textContent = '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
  });
}

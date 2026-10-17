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
// Send every enquiry directly to ToBa's persistent private inbox.
const inquiryForm = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');
if (inquiryForm) {
  inquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = inquiryForm.querySelector('[type="submit"]');
    if (location.protocol === 'file:') {
      if (formStatus) formStatus.textContent = 'This form works on the deployed website. A file preview cannot submit enquiries.';
      return;
    }
    if (button.disabled) return;
    button.disabled = true;
    const original = button.innerHTML;
    button.textContent = 'Sending your enquiry…';
    if (formStatus) formStatus.textContent = 'Saving your project enquiry securely…';
    try {
      const formData = new FormData(inquiryForm);
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch('/.netlify/functions/submit-inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), credentials:'same-origin'
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'We could not send your enquiry. Please try again.');
      window.location.assign('/thank-you');
    } catch (error) {
      if (formStatus) { formStatus.textContent = error.message || 'Unable to send. Please try again.'; formStatus.style.color = '#ffcf9d'; }
    } finally { button.disabled = false; button.innerHTML = original; }
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

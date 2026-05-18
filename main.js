// ============================================
// LEILANI'S CLASSY CLEANING — MAIN JS
// Form submission via Formspree → Twilio SMS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const successMsg = document.getElementById('formSuccess');

  // ---- FORMSPREE ENDPOINT ----
  // Replace YOUR_FORM_ID with the actual Formspree form ID
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xredbepv';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable button + show loading
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Show success
        form.reset();
        successMsg.style.display = 'block';
        btnText.textContent = 'Request Sent ✦';
        submitBtn.style.background = '#5C0F26';
        submitBtn.style.color = '#C9A84C';
      } else {
        throw new Error('Form submission failed');
      }

    } catch (err) {
      btnText.textContent = 'Something went wrong — please call us!';
      submitBtn.disabled = false;
      console.error(err);
    }
  });

  // ---- SMOOTH NAV ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

});
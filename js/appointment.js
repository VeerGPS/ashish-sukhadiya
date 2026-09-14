document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('appointmentForm');
  if (!form) return;

  const typeOptions = document.querySelectorAll('.type-option');
  const dateInput = document.getElementById('preferredDate');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');

  // Prevent picking a date in the past
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  typeOptions.forEach((option) => {
    option.addEventListener('click', () => {
      typeOptions.forEach((o) => o.classList.remove('active'));
      option.classList.add('active');
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      feedback.className = 'form-feedback success';
      feedback.textContent = "Thank you! Your appointment request has been received. I'll confirm your slot by email or phone shortly.";
      form.reset();
      typeOptions.forEach((o) => o.classList.remove('active'));
      typeOptions[0].classList.add('active');
      typeOptions[0].querySelector('input').checked = true;
      window.scrollTo({ top: form.offsetTop - 140, behavior: 'smooth' });
    } catch (err) {
      feedback.className = 'form-feedback error';
      feedback.textContent = err.message || 'Something went wrong. Please try again later.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Appointment Request';
    }
  });
});

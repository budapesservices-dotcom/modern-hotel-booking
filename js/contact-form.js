document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const submitButton = form.querySelector("[data-contact-submit]");
  const status = form.querySelector("[data-contact-status]");

  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  const validateForm = () => {
    // The form uses novalidate because submission is handled by JavaScript.
    // Explicitly invoke native constraint validation so required/type rules
    // still work before any request is sent.
    if (form.checkValidity()) return true;

    form.reportValidity();
    setStatus("Please check the required fields and try again.", "error");
    return false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-sending");
    }

    setStatus("Sending your message…");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    delete payload._honey;

    try {
      const email = window.STILL_CONTACT?.email || "stay@thestillhotel.example";
      const response = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to send the message.");
      }

      form.reset();
      setStatus("Your message has been sent. We’ll be in touch soon.", "success");
    } catch (error) {
      setStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("is-sending");
      }
    }
  });
});

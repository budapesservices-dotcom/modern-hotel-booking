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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-sending");
    }
    setStatus("Sending your message…");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    delete payload._honey;

    try {
      const response = await fetch("https://formsubmit.co/ajax/stay@thestillhotel.example", {
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

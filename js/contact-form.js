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
    if (submitButton) { submitButton.disabled = true; submitButton.classList.add("is-sending"); }
    setStatus("Sending your message…");
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "Unable to send the message.");
      form.reset();
      setStatus(result.message, "success");
    } catch (error) {
      setStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.classList.remove("is-sending"); }
    }
  });
});

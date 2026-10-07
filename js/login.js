document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  const submitButton = form.querySelector("[data-login-submit]");
  const status = form.querySelector("[data-login-status]");

  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please enter a valid email address and password.", "error");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-sending");
    }

    const password = form.elements.password;
    if (password) password.value = "";

    setStatus(
      "Guest sign-in is not connected in this demo. Use Your Booking to review your booking request.",
      "error"
    );

    window.setTimeout(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("is-sending");
      }
    }, 500);
  });
});

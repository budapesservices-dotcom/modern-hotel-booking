/*
  THE STILL HOTEL — CONTACT CONFIG
  Replace these values once before final submission.
  Every page and contact action reads from this file.
*/
window.STILL_CONTACT = {
  whatsappNumber: "620000000000",
  phoneDisplay: "+62 000 0000 0000",
  phoneHref: "+620000000000",
  email: "stay@thestillhotel.example",
  mapQuery: "Jakarta, Indonesia"
};

document.addEventListener("DOMContentLoaded", () => {
  const contact = window.STILL_CONTACT;
  if (!contact) return;

  const whatsappHref = "https://wa.me/" + contact.whatsappNumber;
  const emailHref = "mailto:" + contact.email;
  const phoneHref = "tel:" + contact.phoneHref;

  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
    const current = link.getAttribute("href") || "";
    const query = current.includes("?") ? current.slice(current.indexOf("?")) : "";
    link.href = whatsappHref + query;
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.href = emailHref;
    if (link.textContent.trim() === "stay@thestillhotel.example") {
      link.textContent = contact.email;
    }
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.href = phoneHref;
    if (link.textContent.trim() === "+62 000 0000 0000") {
      link.textContent = contact.phoneDisplay;
    }
  });

  document.querySelectorAll("[data-contact-email]").forEach(el => {
    el.textContent = contact.email;
    if (el.tagName === "A") el.href = emailHref;
  });

  document.querySelectorAll("[data-contact-phone]").forEach(el => {
    el.textContent = contact.phoneDisplay;
    if (el.tagName === "A") el.href = phoneHref;
  });

  document.querySelectorAll("[data-contact-whatsapp]").forEach(el => {
    if (el.tagName === "A") el.href = whatsappHref;
  });

  const map = document.querySelector(".contact-map-frame iframe");
  if (map && contact.mapQuery) {
    map.src = "https://www.google.com/maps?q=" + encodeURIComponent(contact.mapQuery) + "&output=embed";
  }
});

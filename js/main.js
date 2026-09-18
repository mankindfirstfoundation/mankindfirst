/* Mankind First Foundation — site behaviour
   Lean vanilla JS: mobile nav, sticky header, reveal-on-scroll,
   accessible form validation, footer year. No trackers. */
(function () {
  "use strict";

  /* ----- Sticky header shadow ----- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----- Mobile navigation ----- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav-menu");
  if (toggle && nav) {
    var navWrap = toggle.closest(".primary-nav") || nav.parentElement;
    toggle.addEventListener("click", function () {
      var open = navWrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navWrap.classList.contains("open")) {
        navWrap.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        toggle.focus();
      }
    });
  }

  /* ----- Reveal on scroll ----- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ----- Footer year ----- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ----- Accessible client-side form validation -----
     NOTE: connect a form endpoint (e.g. Formspree) via data-endpoint
     attribute on the <form>. Until then, submissions are simulated
     locally and clearly reported as such. */
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");

    var validateField = function (field) {
      var wrap = field.closest(".field");
      if (!wrap) return true;
      var ok = true;
      if (field.hasAttribute("required") && !field.value.trim()) ok = false;
      if (ok && field.type === "email" && field.value.trim()) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim());
      }
      if (ok && field.hasAttribute("data-minlen")) {
        ok = field.value.trim().length >= parseInt(field.getAttribute("data-minlen"), 10);
      }
      wrap.classList.toggle("invalid", !ok);
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll("input[required], select[required], textarea[required]");
      var firstBad = null;
      fields.forEach(function (f) {
        if (!validateField(f) && !firstBad) firstBad = f;
      });
      if (firstBad) { firstBad.focus(); return; }

      var consent = form.querySelector('input[type="checkbox"][required]');
      if (consent && !consent.checked) {
        consent.focus();
        return;
      }

      var status = form.querySelector(".form-status");
      var endpoint = form.getAttribute("data-endpoint");

      if (endpoint && endpoint.indexOf("http") === 0) {
        // Real endpoint configured — send it.
        fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error("Network response was not ok");
            form.reset();
            if (status) { status.className = "form-status success"; status.textContent = "Thank you — your message has been sent. We will reply as soon as we can."; }
          })
          .catch(function () {
            if (status) { status.className = "form-status fail"; status.textContent = "Something went wrong sending your message. Please try again in a moment."; }
          });
      } else {
        // No endpoint yet — demonstrate success state honestly.
        form.reset();
        if (status) {
          status.className = "form-status success";
          status.textContent = "Thank you — this form is ready and validated. Once a delivery inbox is connected, messages like yours will arrive securely. (Demo mode: nothing was sent.)";
        }
      }
    });

    form.addEventListener("input", function (e) {
      if (e.target.closest(".field.invalid")) validateField(e.target);
    });
  });
})();

(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".main-nav");
  var menuButton = document.querySelector(".menu-toggle");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav a"));
  var fill = document.querySelector(".progress-fill");
  var steps = document.querySelectorAll(".steps > li");
  var delivery = document.querySelector(".delivery-track");
  var approval = document.querySelector(".approval-window");
  var approvalStatus = document.querySelector(".status-pill");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function menuLabel(open) {
    var ar = root.getAttribute("lang") === "ar";
    if (ar) return open ? "أغلق قائمة التنقل" : "افتح قائمة التنقل";
    return open ? "Close navigation" : "Open navigation";
  }

  function setMenu(open) {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", menuLabel(open));
    nav.classList.toggle("is-open", open);
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    menuButton.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.focus();
      }
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuButton && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);

  if ("IntersectionObserver" in window && navLinks.length) {
    var sections = navLinks.map(function (link) {
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return null;
      return document.querySelector(href);
    }).filter(Boolean);
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var active = link.getAttribute("href") === "#" + entry.target.id;
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -62% 0px", threshold: 0 });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  if (delivery && fill) {
    var scheduled = false;
    function updateProgress() {
      var bounds = delivery.getBoundingClientRect();
      var travel = bounds.height + window.innerHeight;
      var progress = reduceMotion ? 1 : Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / travel));
      fill.style.width = (progress * 100) + "%";
    }
    function requestProgress() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        updateProgress();
        scheduled = false;
      });
    }
    window.addEventListener("scroll", requestProgress, { passive: true });
    window.addEventListener("resize", requestProgress);
    updateProgress();
    if ("IntersectionObserver" in window && steps.length) {
      var stepObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("is-passed");
        });
      }, { threshold: 0.35 });
      steps.forEach(function (step) { stepObserver.observe(step); });
    }
  }

  function approve() {
    if (!approvalStatus || approvalStatus.getAttribute("data-state") === "approved") return;
    approvalStatus.setAttribute("data-state", "approved");
    approvalStatus.classList.add("is-approved");
    var label = approvalStatus.querySelector("span");
    if (label) {
      label.textContent = "Approved";
      label.setAttribute("data-en", "Approved");
      label.setAttribute("data-ar", "تمت الموافقة");
    }
    var empty = approval && approval.querySelector(".avatar-empty");
    var lines = approval && approval.querySelectorAll(".track-line");
    if (empty) empty.classList.add("avatar-approved");
    if (lines && lines[1]) lines[1].classList.add("track-approved");
    var labels = approval && approval.querySelectorAll(".approval-labels span");
    if (labels && labels[2]) labels[2].classList.add("label-approved");
  }

  if (approval && !reduceMotion) {
    window.setTimeout(approve, 2050);
  } else if (approval) {
    approvalStatus.classList.add("is-approved");
    approvalStatus.setAttribute("data-state", "approved");
    var finalLabel = approvalStatus.querySelector("span");
    if (finalLabel) {
      finalLabel.textContent = "Approved";
      finalLabel.setAttribute("data-en", "Approved");
      finalLabel.setAttribute("data-ar", "تمت الموافقة");
    }
    var finalEmpty = approval.querySelector(".avatar-empty");
    var finalLines = approval.querySelectorAll(".track-line");
    var finalLabels = approval.querySelectorAll(".approval-labels span");
    if (finalEmpty) finalEmpty.classList.add("avatar-approved");
    if (finalLines[1]) finalLines[1].classList.add("track-approved");
    if (finalLabels[2]) finalLabels[2].classList.add("label-approved");
  }

  document.addEventListener("qcore:lang", function () {
    if (!menuButton) return;
    setMenu(menuButton.getAttribute("aria-expanded") === "true");
  });
})();

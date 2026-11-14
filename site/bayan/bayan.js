/* Marks a phone frame when its screenshot is missing or fails to load.
   Registered before body images exist, so a fast 404 is still caught. */
(function () {
  "use strict";

  function mark(img) {
    if (!img || img.tagName !== "IMG" || !img.closest) return;
    var phone = img.closest(".phone");
    if (!phone) return;
    phone.classList.add("is-missing");
  }

  document.addEventListener("error", function (event) {
    mark(event.target);
  }, true);

  document.addEventListener("DOMContentLoaded", function () {
    var images = document.querySelectorAll(".phone img");
    for (var i = 0; i < images.length; i++) {
      if (images[i].complete && images[i].naturalWidth === 0) mark(images[i]);
    }
  });
})();

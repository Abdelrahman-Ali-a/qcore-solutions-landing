/* Contact form: sends to Web3Forms with fetch and reports the result in
   place. Without JS the form still posts to Web3Forms directly. Status
   text comes from data-sending / data-ok / data-fail on the form, which
   lang.js swaps for their data-ar-* versions. */
(function () {
  "use strict";
  var form = document.getElementById("message");
  if (!form || !window.fetch || !window.FormData) return;
  var status = form.querySelector(".form-status");
  var button = form.querySelector("button[type=submit]");

  function say(key, state) {
    status.textContent = form.getAttribute("data-" + key) || "";
    form.setAttribute("data-state", state);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.getAttribute("data-state") === "sending") return;
    var data = new FormData(form);
    if (data.get("botcheck")) return;
    data.append("page_language", document.documentElement.lang || "en");
    button.disabled = true;
    say("sending", "sending");
    // FormData with no custom Content-Type is a CORS "simple" request: no
    // preflight, which Web3Forms answers with 403.
    fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.success; }); })
      .then(function (ok) {
        if (ok) { form.reset(); say("ok", "sent"); }
        else say("fail", "error");
      })
      .catch(function () { say("fail", "error"); })
      .then(function () { button.disabled = false; });
  });
})();

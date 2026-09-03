// Focus trap for modal dialogs (no new deps).
// Keeps Tab/Shift+Tab inside `container`, returns focus to `restoreTo` on release.

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function trapFocus(container, restoreTo) {
  if (!container) return () => {};
  const prevActive = restoreTo || document.activeElement;

  const onKey = (e) => {
    if (e.key !== "Tab") return;
    let items = [];
    try {
      items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.getAttribute("aria-hidden") !== "true" && el.offsetParent !== null
      );
    } catch (err) {
      return;
    }
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKey);
  // Initial focus: first focusable, or the container itself.
  try {
    const first = container.querySelector("[data-autofocus]") || container.querySelector(FOCUSABLE);
    if (first) first.focus();
    else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }
  } catch (e) {
    // ignore
  }

  return () => {
    container.removeEventListener("keydown", onKey);
    try {
      if (prevActive && prevActive.focus) prevActive.focus();
    } catch (e) {
      // ignore
    }
  };
}

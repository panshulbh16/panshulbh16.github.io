// Share buttons under each project: native share sheet on phones, copy to clipboard elsewhere.
const touch = window.matchMedia("(pointer: coarse)").matches;

function flash(button, text) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  button.textContent = text;
  button.classList.add("is-done");
  window.clearTimeout(Number(button.dataset.timer));
  button.dataset.timer = String(window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-done");
  }, 1800));
}

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

for (const button of document.querySelectorAll("[data-share-url]")) {
  const url = button.dataset.shareUrl;
  const title = button.dataset.shareTitle;
  if (touch && navigator.share) button.textContent = "Share";

  button.addEventListener("click", async () => {
    if (touch && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flash(button, "Copied");
    } catch {
      const shown = button.parentElement.querySelector(".share-url");
      if (shown) selectText(shown);
      flash(button, "Press Ctrl+C");
    }
  });
}

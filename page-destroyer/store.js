// Page Destroyer install links, shared by the portfolio and the product page.
// Once the Chrome Web Store listing is approved, paste its link into STORE_URL, e.g.
// export const STORE_URL = "https://chromewebstore.google.com/detail/page-destroyer/abcdefghijklmnop";
// Every "Add to Chrome" button then opens the store instead of downloading the zip.
export const STORE_URL = "https://chromewebstore.google.com/detail/page-destroyer/bocojoojllaabmifnbjiehdodgmlccah";

export const ZIP_URL = "/page-destroyer/page-destroyer.zip";
export const SCRIPT_URL = "/page-destroyer/destroyer.js";

export function wireChromeLinks(root = document) {
  for (const a of root.querySelectorAll("[data-chrome-link]")) {
    const label = a.querySelector("[data-chrome-label]") || a;
    if (STORE_URL) {
      a.href = STORE_URL;
      a.target = "_blank";
      a.rel = "noopener";
      a.removeAttribute("download");
      label.textContent = "Add to Chrome";
    } else {
      a.href = ZIP_URL;
      a.setAttribute("download", "page-destroyer.zip");
      a.removeAttribute("target");
      label.textContent = "Download for Chrome";
    }
  }
  for (const el of root.querySelectorAll("[data-when-store]")) el.hidden = !STORE_URL;
  for (const el of root.querySelectorAll("[data-when-manual]")) el.hidden = Boolean(STORE_URL);
}

export function wireDestroyButtons(root = document) {
  for (const button of root.querySelectorAll("[data-destroy-here]")) {
    button.addEventListener("click", () => {
      const s = document.createElement("script");
      s.src = SCRIPT_URL;
      s.onload = () => s.remove();
      s.onerror = () => s.remove();
      document.body.appendChild(s);
    });
  }
}

wireChromeLinks();
wireDestroyButtons();

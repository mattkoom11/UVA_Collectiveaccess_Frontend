// model-viewer is vendored as a self-contained bundle (it carries its own
// three.js; every npm release pins a three peer that excludes ours). It is
// injected on first use so visitors who never open AR never download it.
// A script inserted by our own nonced bundle is allowed by the
// 'strict-dynamic' CSP set in proxy.ts.
const MODEL_VIEWER_SRC = "/vendor/model-viewer-4.3.1.min.js";

let pending: Promise<void> | null = null;

export function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadModelViewer is browser-only"));
  }
  if (customElements.get("model-viewer")) return Promise.resolve();

  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = MODEL_VIEWER_SRC;
      script.onload = () => {
        customElements.whenDefined("model-viewer").then(() => resolve(), reject);
      };
      script.onerror = () => {
        // Forget the failed attempt so "Try again" injects a fresh script
        pending = null;
        script.remove();
        reject(new Error("model-viewer failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return pending;
}

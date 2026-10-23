// model-viewer is vendored as a self-contained bundle (it carries its own
// three.js; every npm release pins a three peer that excludes ours). It is
// injected on first use so visitors who never open AR never download it.
// A script inserted by our own nonced bundle is allowed by the
// 'strict-dynamic' CSP set in proxy.ts.
const MODEL_VIEWER_SRC = "/vendor/model-viewer-4.3.1.min.js";
// The scans are meshopt-compressed, and model-viewer ships no decoder of its
// own: it injects whatever script this points at, so it's vendored too.
const MESHOPT_DECODER_SRC = "/vendor/meshopt_decoder-0.22.0.js";
// If the bundle downloads but throws while running (an older WebView without
// the ES features model-viewer 4 needs), onload still fires and the element
// never registers; without a deadline the sheet would show "Loading…" forever.
const REGISTER_TIMEOUT_MS = 15_000;

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
      // Forget a failed attempt so "Try again" injects a fresh script
      const fail = (error: Error) => {
        pending = null;
        script.remove();
        reject(error);
      };
      script.onload = () => {
        withTimeout(
          customElements.whenDefined("model-viewer"),
          REGISTER_TIMEOUT_MS,
          "model-viewer never registered",
        ).then(() => {
          const ModelViewer = customElements.get("model-viewer") as
            | (CustomElementConstructor & { meshoptDecoderLocation?: string })
            | undefined;
          if (ModelViewer) ModelViewer.meshoptDecoderLocation = MESHOPT_DECODER_SRC;
          resolve();
        }, fail);
      };
      script.onerror = () => fail(new Error("model-viewer failed to load"));
      document.head.appendChild(script);
    });
  }
  return pending;
}

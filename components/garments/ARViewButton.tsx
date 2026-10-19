"use client";

import { useEffect, useRef, useState } from "react";
import { Box, X } from "lucide-react";
import type { Garment } from "@/types/garment";
import type { ModelViewerElement } from "@/types/model-viewer";
import { AR_MODES, arScaleFactor, modelViewerOrientation, prefersARSheet, targetHeightCm } from "@/lib/arScale";
import { loadModelViewer } from "@/lib/loadModelViewer";
import { trapFocusIndex } from "@/lib/focusTrap";
import ARQRCode from "./ARQRCode";

type Mode = "closed" | "sheet" | "qr";
type LoadState = "loading" | "ready" | "error";

interface Props {
  garment: Garment;
}

// "View in your space": on phones and tablets, a full-screen <model-viewer>
// sheet that places the scan in the room at its real height; on desktops, a
// QR code that hands the page to a phone.
export default function ARViewButton({ garment }: Props) {
  const [mode, setMode] = useState<Mode>("closed");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [arUnavailable, setArUnavailable] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const viewerRef = useRef<ModelViewerElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Load the library when the sheet opens (and again on "Try again")
  useEffect(() => {
    if (mode !== "sheet") return;
    let cancelled = false;
    loadModelViewer().then(
      () => {
        if (!cancelled) setLoadState("ready");
      },
      () => {
        if (!cancelled) setLoadState("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [mode, attempt]);

  // Once the model loads, scale it to the garment's real height (measured
  // once at the model's native scale) and record whether AR is available
  useEffect(() => {
    const viewer = viewerRef.current;
    if (mode !== "sheet" || loadState !== "ready" || !viewer) return;
    let scaled = false;
    const onLoad = () => {
      if (!scaled) {
        const s = arScaleFactor(viewer.getDimensions().y, targetHeightCm(garment));
        viewer.scale = `${s} ${s} ${s}`;
        scaled = true;
      }
      setArUnavailable(!viewer.canActivateAR);
    };
    // The element is created in the same commit as this effect, so its
    // model can't have finished loading yet; listening is enough.
    viewer.addEventListener("load", onLoad);
    return () => viewer.removeEventListener("load", onLoad);
  }, [mode, loadState, garment]);

  // The sheet is a real modal: focus moves into it, Tab stays inside it, the
  // page behind it stops scrolling, and focus returns to the trigger on close
  useEffect(() => {
    if (mode !== "sheet") return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      const sheet = sheetRef.current;
      if (e.key !== "Tab" || !sheet) return;
      const focusables = Array.from(
        sheet.querySelectorAll<HTMLElement>('button, [href], input, model-viewer, [tabindex]:not([tabindex="-1"])'),
      );
      const next = trapFocusIndex(focusables.indexOf(document.activeElement as HTMLElement), focusables.length, e.shiftKey);
      if (next === null) return;
      e.preventDefault();
      focusables[next].focus();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [mode]);

  // Escape closes the sheet or the QR popover
  useEffect(() => {
    if (mode === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  if (!garment.model3d_url) return null;

  const open = () => {
    const touch = prefersARSheet({
      maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    });
    setPageUrl(window.location.origin + window.location.pathname);
    setArUnavailable(false);
    setLoadState("loading");
    setMode(touch ? "sheet" : "qr");
  };

  const retry = () => {
    setLoadState("loading");
    setAttempt((n) => n + 1);
  };

  const close = () => setMode("closed");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-2 px-4 py-3 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors"
      >
        <Box className="w-4 h-4" aria-hidden />
        View in your space
      </button>

      {mode === "qr" && (
        <div
          role="dialog"
          aria-label="Open on your phone"
          className="mt-3 inline-flex flex-col items-center gap-3 border border-archive-border bg-archive-surface p-4"
        >
          <ARQRCode url={pageUrl} />
          <p className="text-xs text-archive-muted max-w-[12rem] text-center">
            Open on your phone to see it in your room
          </p>
          <button
            type="button"
            onClick={close}
            className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg"
          >
            Close
          </button>
        </div>
      )}

      {mode === "sheet" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${garment.label} in augmented reality`}
          ref={sheetRef}
          className="fixed inset-0 z-50 flex flex-col bg-archive-bg"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-archive-border">
            <p className="text-xs uppercase tracking-[0.2em] text-archive-fg">{garment.label}</p>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="text-archive-fg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1">
            {loadState === "loading" && (
              <p className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-archive-muted">
                Loading…
              </p>
            )}

            {loadState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-archive-muted">AR couldn&apos;t load.</p>
                <button
                  type="button"
                  onClick={retry}
                  className="px-4 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg"
                >
                  Try again
                </button>
              </div>
            )}

            {loadState === "ready" && (
              <model-viewer
                ref={viewerRef}
                src={garment.model3d_url}
                alt={garment.label}
                ar
                ar-modes={AR_MODES}
                ar-scale="fixed"
                camera-controls
                orientation={modelViewerOrientation(garment.model3d_rotationY)}
                style={{ width: "100%", height: "100%" }}
              >
                <button
                  slot="ar-button"
                  type="button"
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-archive-fg text-archive-bg text-xs uppercase tracking-[0.2em]"
                >
                  Place in your room
                </button>
              </model-viewer>
            )}

            {arUnavailable && (
              <p className="absolute bottom-6 inset-x-4 text-center text-xs text-archive-muted">
                AR isn&apos;t supported on this device. You can still turn the garment in 3D.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

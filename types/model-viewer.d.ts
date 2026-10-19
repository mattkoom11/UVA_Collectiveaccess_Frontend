import type { DetailedHTMLProps, HTMLAttributes } from "react";

// The subset of <model-viewer> (https://modelviewer.dev) this site uses.
export interface ModelViewerElement extends HTMLElement {
  canActivateAR: boolean;
  scale: string;
  getDimensions(): { x: number; y: number; z: number };
  activateAR(): Promise<void>;
}

interface ModelViewerAttributes extends HTMLAttributes<ModelViewerElement> {
  src?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "camera-controls"?: boolean;
  orientation?: string;
  "shadow-intensity"?: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<ModelViewerAttributes, ModelViewerElement>;
    }
  }
}

"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ReactNode } from "react";

export default function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}


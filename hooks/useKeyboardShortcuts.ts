"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push("/collection");
        }
      }

      // Escape to close modals/dropdowns
      if (e.key === "Escape") {
        const modals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
        modals.forEach((modal) => {
          const closeButton = modal.querySelector('[data-close], button[aria-label*="close" i]') as HTMLButtonElement;
          if (closeButton) closeButton.click();
        });
      }

      // Cmd/Ctrl + / for help (could show keyboard shortcuts)
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        // Could show a help modal here
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}


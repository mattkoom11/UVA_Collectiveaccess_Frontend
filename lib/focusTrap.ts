// Index to move focus to when Tab (or Shift+Tab) is pressed inside a modal
// with `count` focusable elements, focus currently at `current` (-1 when
// focus is outside the modal). Returns null when the browser's own Tab
// behaviour already stays inside the modal.
export function trapFocusIndex(current: number, count: number, shiftKey: boolean): number | null {
  if (count === 0) return null;
  const first = 0;
  const last = count - 1;
  if (current === -1) return shiftKey ? last : first;
  if (shiftKey && current === first) return last;
  if (!shiftKey && current === last) return first;
  return null;
}

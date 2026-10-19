import { describe, it, expect } from "vitest";
import { trapFocusIndex } from "./focusTrap";

describe("trapFocusIndex", () => {
  it("wraps Tab from the last element to the first", () => {
    expect(trapFocusIndex(2, 3, false)).toBe(0);
  });
  it("wraps Shift+Tab from the first element to the last", () => {
    expect(trapFocusIndex(0, 3, true)).toBe(2);
  });
  it("pulls focus back in when it is outside the sheet", () => {
    expect(trapFocusIndex(-1, 3, false)).toBe(0);
    expect(trapFocusIndex(-1, 3, true)).toBe(2);
  });
  it("lets the browser handle Tab in the middle of the list", () => {
    expect(trapFocusIndex(1, 3, false)).toBeNull();
    expect(trapFocusIndex(1, 3, true)).toBeNull();
  });
  it("returns null when there is nothing focusable", () => {
    expect(trapFocusIndex(-1, 0, false)).toBeNull();
  });
});

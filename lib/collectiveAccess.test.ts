import { describe, it, expect } from "vitest";
import { getCollectiveAccessClient, type CAObject } from "./collectiveAccess";

// isPublic() does not touch the network or config, so a single client
// instance (constructed with dummy config) is safe to reuse across cases.
const client = getCollectiveAccessClient({
  baseUrl: "https://example.invalid",
  username: "test",
  password: "test",
});

function withDisplaySettings(publicDisplay: unknown): CAObject {
  return {
    object_id: 1,
    idno: "TEST.1",
    type_id: 1,
    "ca_objects.web_display_settings": {
      "1": { en_US: { public_display: publicDisplay } },
    },
  };
}

describe("isPublic — fail-closed public_display filter", () => {
  it("treats boolean true as public", () => {
    expect(client.isPublic(withDisplaySettings(true))).toBe(true);
  });

  it("treats numeric 1 as public", () => {
    expect(client.isPublic(withDisplaySettings(1))).toBe(true);
  });

  it.each(["1", "true", "yes", "Yes", "TRUE", " yes "])(
    "treats string %j as public",
    (value) => {
      expect(client.isPublic(withDisplaySettings(value))).toBe(true);
    }
  );

  it.each(["0", "false", "no", "", "maybe"])(
    "treats string %j as NOT public",
    (value) => {
      expect(client.isPublic(withDisplaySettings(value))).toBe(false);
    }
  );

  it("fails closed when public_display is missing", () => {
    const obj: CAObject = {
      object_id: 1,
      idno: "TEST.1",
      type_id: 1,
      "ca_objects.web_display_settings": { "1": { en_US: {} } },
    };
    expect(client.isPublic(obj)).toBe(false);
  });

  it("fails closed when the whole bundle is absent", () => {
    const obj: CAObject = { object_id: 1, idno: "TEST.1", type_id: 1 };
    expect(client.isPublic(obj)).toBe(false);
  });

  it("fails closed on boolean false and numeric 0", () => {
    expect(client.isPublic(withDisplaySettings(false))).toBe(false);
    expect(client.isPublic(withDisplaySettings(0))).toBe(false);
  });

  it("falls back to entries without an en_US locale wrapper", () => {
    const obj: CAObject = {
      object_id: 1,
      idno: "TEST.1",
      type_id: 1,
      "ca_objects.web_display_settings": { "1": { public_display: "yes" } },
    };
    expect(client.isPublic(obj)).toBe(true);
  });
});

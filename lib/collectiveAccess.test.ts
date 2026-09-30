import { describe, it, expect } from "vitest";
import { getCollectiveAccessClient, isYesValue, parseModelEntries, type CAObject } from "./collectiveAccess";

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

describe("isYesValue", () => {
  it.each([true, 1, "yes", "Yes", "1", "true"])("reads %j as yes", (v) => {
    expect(isYesValue(v)).toBe(true);
  });

  it.each([false, 0, "no", "", undefined, null, 742])("reads %j as no", (v) => {
    expect(isYesValue(v)).toBe(false);
  });
});

describe("parseModelEntries", () => {
  it("keeps full URLs and site paths, with role and format", () => {
    expect(
      parseModelEntries([
        { model_file_reference: "https://cdn.example.invalid/dress.glb", model_format: "GLB", model_role: "web_preview" },
        { model_file_reference: "/models/dress-full.glb", model_role: "full_detail" },
      ])
    ).toEqual([
      { url: "https://cdn.example.invalid/dress.glb", role: "web_preview", format: "GLB" },
      { url: "/models/dress-full.glb", role: "full_detail" },
    ]);
  });

  it("drops bare filenames and empty references", () => {
    expect(
      parseModelEntries([
        { model_file_reference: "dress_final_v2.glb" },
        { model_file_reference: "" },
        { model_format: "GLB" },
      ])
    ).toEqual([]);
  });

  it.each([
    ["web_preview", "web_preview"],
    ["Web preview", "web_preview"],
    ["Full Detail", "full_detail"],
    ["archival-master", "archival_master"],
    ["something else", undefined],
    [42, undefined],
  ])("normalizes role %j to %j", (raw, expected) => {
    const [model] = parseModelEntries([{ model_file_reference: "/m.glb", model_role: raw }]);
    expect(model.role).toBe(expected);
  });
});

describe("convertToGarment — runway fields", () => {
  const base: CAObject = { object_id: 7, idno: "DR.1925.001", type_id: 1 };

  it("reads the runway flag, runway order and 3D files", () => {
    const garment = client.convertToGarment({
      ...base,
      "ca_objects.web_display_settings": {
        "1": { en_US: { public_display: "yes", featured_on_runway: "yes", homepage_order: "3" } },
      },
      "ca_objects.object_3d_documentation": {
        "10": { en_US: { model_file_reference: "https://x.invalid/full.glb", model_role: "full_detail" } },
        "11": { en_US: { model_file_reference: "https://x.invalid/preview.glb", model_role: "web_preview" } },
      },
    });
    expect(garment.featuredOnRunway).toBe(true);
    expect(garment.runwayOrder).toBe(3);
    expect(garment.models).toHaveLength(2);
    expect(garment.model3d_url).toBe("https://x.invalid/preview.glb");
  });

  it("leaves 3D fields unset and the flag off when CA has none", () => {
    const garment = client.convertToGarment(base);
    expect(garment.featuredOnRunway).toBe(false);
    expect(garment.runwayOrder).toBeUndefined();
    expect(garment.models).toBeUndefined();
    expect(garment.model3d_url).toBeUndefined();
  });
});

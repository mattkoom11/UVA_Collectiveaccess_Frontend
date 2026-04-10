export interface FilterPreset {
  id: string;
  name: string;
  era?: string;
  type?: string;
  color?: string;
  material?: string;
  dateStart?: number;
  dateEnd?: number;
}

const PRESETS_KEY = "uva-fashion-filter-presets";

export function getFilterPresets(): FilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFilterPreset(preset: FilterPreset): void {
  if (typeof window === "undefined") return;
  try {
    const presets = getFilterPresets();
    const existingIndex = presets.findIndex((p) => p.id === preset.id);
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore errors
  }
}

export function deleteFilterPreset(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const presets = getFilterPresets().filter((p) => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore errors
  }
}

export function getPresetURL(preset: FilterPreset, basePath: string = "/collection"): string {
  const params = new URLSearchParams();
  if (preset.era && preset.era !== "all") params.set("era", preset.era);
  if (preset.type && preset.type !== "all") params.set("type", preset.type);
  if (preset.color && preset.color !== "all") params.set("color", preset.color);
  if (preset.material && preset.material !== "all") params.set("material", preset.material);
  if (preset.dateStart) params.set("dateStart", preset.dateStart.toString());
  if (preset.dateEnd) params.set("dateEnd", preset.dateEnd.toString());
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
}

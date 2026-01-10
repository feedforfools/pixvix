/**
 * Color grouping and adjustment utilities.
 * Groups colors by hue ranges and applies uniform adjustments to groups
 * while preserving relative differences within each group.
 */

import type {
  PixelColor,
  HSLColor,
  PaletteEntry,
  ColorGroup,
  ColorGroupId,
  GroupAdjustment,
  GroupAdjustments,
} from "../types";

/** Threshold for considering a color "gray" (low saturation) */
const GRAY_SATURATION_THRESHOLD = 12;

/** Color group definitions with hue ranges */
const COLOR_GROUP_DEFS: {
  id: ColorGroupId;
  name: string;
  hueMin: number;
  hueMax: number;
  representativeHue: number;
}[] = [
  { id: "reds", name: "Reds", hueMin: 345, hueMax: 15, representativeHue: 0 },
  {
    id: "oranges",
    name: "Oranges",
    hueMin: 15,
    hueMax: 45,
    representativeHue: 30,
  },
  {
    id: "yellows",
    name: "Yellows",
    hueMin: 45,
    hueMax: 75,
    representativeHue: 60,
  },
  {
    id: "greens",
    name: "Greens",
    hueMin: 75,
    hueMax: 165,
    representativeHue: 120,
  },
  {
    id: "cyans",
    name: "Cyans",
    hueMin: 165,
    hueMax: 195,
    representativeHue: 180,
  },
  {
    id: "blues",
    name: "Blues",
    hueMin: 195,
    hueMax: 265,
    representativeHue: 220,
  },
  {
    id: "purples",
    name: "Purples",
    hueMin: 265,
    hueMax: 345,
    representativeHue: 300,
  },
];

/**
 * Convert RGB to HSL color space.
 */
export function rgbToHsl(color: PixelColor): HSLColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

/**
 * Convert HSL to RGB color space.
 */
export function hslToRgb(hsl: HSLColor): PixelColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray, a: 255 };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: 255,
  };
}

/**
 * Determine which color group a hue belongs to.
 */
function getColorGroupId(hsl: HSLColor): ColorGroupId {
  // Low saturation = gray, regardless of hue
  if (hsl.s < GRAY_SATURATION_THRESHOLD) {
    return "grays";
  }

  const hue = hsl.h;

  for (const def of COLOR_GROUP_DEFS) {
    // Handle wrap-around for reds (345-15)
    if (def.hueMin > def.hueMax) {
      if (hue >= def.hueMin || hue < def.hueMax) {
        return def.id;
      }
    } else {
      if (hue >= def.hueMin && hue < def.hueMax) {
        return def.id;
      }
    }
  }

  // Fallback (shouldn't happen)
  return "grays";
}

/**
 * Group palette colors by hue ranges.
 * Returns only groups that have at least one color.
 */
export function groupColorsByHue(palette: PaletteEntry[]): ColorGroup[] {
  // Initialize empty groups
  const groupMap = new Map<ColorGroupId, PaletteEntry[]>();

  // Classify each color into a group
  for (const entry of palette) {
    const hsl = rgbToHsl(entry.color);
    const groupId = getColorGroupId(hsl);

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId)!.push(entry);
  }

  // Build result with only non-empty groups
  const result: ColorGroup[] = [];

  // Add hue-based groups in order
  for (const def of COLOR_GROUP_DEFS) {
    const colors = groupMap.get(def.id);
    if (colors && colors.length > 0) {
      result.push({
        id: def.id,
        name: def.name,
        colors,
        representativeHue: def.representativeHue,
      });
    }
  }

  // Add grays at the end if present
  const grays = groupMap.get("grays");
  if (grays && grays.length > 0) {
    result.push({
      id: "grays",
      name: "Grays",
      colors: grays,
      representativeHue: 0,
    });
  }

  return result;
}

/**
 * Create a default (no-op) adjustment.
 */
export function createDefaultAdjustment(): GroupAdjustment {
  return {
    hueShift: 0,
    saturationScale: 1,
    lightnessScale: 1,
  };
}

/**
 * Check if an adjustment is at default values (no change).
 */
export function isDefaultAdjustment(adj: GroupAdjustment): boolean {
  return (
    adj.hueShift === 0 && adj.saturationScale === 1 && adj.lightnessScale === 1
  );
}

/**
 * Apply a group adjustment to a single color.
 */
export function applyAdjustmentToColor(
  color: PixelColor,
  adjustment: GroupAdjustment
): PixelColor {
  const hsl = rgbToHsl(color);

  // Apply hue shift (wrap around 0-360)
  let newHue = hsl.h + adjustment.hueShift;
  if (newHue < 0) newHue += 360;
  if (newHue >= 360) newHue -= 360;

  // Apply saturation scale (clamp to 0-100)
  const newSat = Math.max(0, Math.min(100, hsl.s * adjustment.saturationScale));

  // Apply lightness scale (clamp to 0-100)
  const newLight = Math.max(
    0,
    Math.min(100, hsl.l * adjustment.lightnessScale)
  );

  return hslToRgb({ h: newHue, s: newSat, l: newLight });
}

/**
 * Get the adjusted color for a given original color, using group adjustments.
 * Returns the original color if no adjustment applies.
 */
export function getAdjustedColor(
  color: PixelColor,
  groupAdjustments: GroupAdjustments
): PixelColor {
  const hsl = rgbToHsl(color);
  const groupId = getColorGroupId(hsl);
  const adjustment = groupAdjustments.get(groupId);

  if (!adjustment || isDefaultAdjustment(adjustment)) {
    return color;
  }

  return applyAdjustmentToColor(color, adjustment);
}

/**
 * Check if any adjustments are active.
 */
export function hasActiveAdjustments(adjustments: GroupAdjustments): boolean {
  for (const adj of adjustments.values()) {
    if (!isDefaultAdjustment(adj)) {
      return true;
    }
  }
  return false;
}

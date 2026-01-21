/**
 * Color utility functions for dynamic theming based on child colors
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Used to determine if text should be light or dark
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine if text should be light or dark based on background color
 * Returns 'light' or 'dark'
 */
export function getContrastTextColor(backgroundColor: string): 'light' | 'dark' {
  const luminance = getRelativeLuminance(backgroundColor);
  // WCAG recommends 0.5 as threshold
  return luminance > 0.5 ? 'dark' : 'light';
}

/**
 * Get text color (hex) that contrasts well with background
 */
export function getContrastingTextHex(backgroundColor: string): string {
  return getContrastTextColor(backgroundColor) === 'light' ? '#ffffff' : '#000000';
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  
  const newR = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
  const newG = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
  const newB = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  
  const newR = Math.max(0, Math.round(r * (1 - percent / 100)));
  const newG = Math.max(0, Math.round(g * (1 - percent / 100)));
  const newB = Math.max(0, Math.round(b * (1 - percent / 100)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Add alpha transparency to a hex color
 */
export function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const a = Math.max(0, Math.min(1, alpha));
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Get a lighter variant of the color for backgrounds
 */
export function getBackgroundVariant(hex: string): string {
  return lightenColor(hex, 85);
}

/**
 * Get a border variant of the color
 */
export function getBorderVariant(hex: string): string {
  return lightenColor(hex, 60);
}

/**
 * Get hover state color (slightly darker)
 */
export function getHoverVariant(hex: string): string {
  return darkenColor(hex, 10);
}

/**
 * Get active/pressed state color (darker)
 */
export function getActiveVariant(hex: string): string {
  return darkenColor(hex, 20);
}

/**
 * Generate a color palette from a base color
 */
export interface ColorPalette {
  base: string;
  light: string;
  lighter: string;
  lightest: string;
  dark: string;
  darker: string;
  background: string;
  border: string;
  hover: string;
  active: string;
  text: string;
}

export function generateColorPalette(baseColor: string): ColorPalette {
  return {
    base: baseColor,
    light: lightenColor(baseColor, 20),
    lighter: lightenColor(baseColor, 40),
    lightest: lightenColor(baseColor, 85),
    dark: darkenColor(baseColor, 20),
    darker: darkenColor(baseColor, 40),
    background: getBackgroundVariant(baseColor),
    border: getBorderVariant(baseColor),
    hover: getHoverVariant(baseColor),
    active: getActiveVariant(baseColor),
    text: getContrastingTextHex(baseColor),
  };
}

/**
 * Get CSS custom properties for a color theme
 */
export function getColorThemeStyles(baseColor: string): Record<string, string> {
  const palette = generateColorPalette(baseColor);
  
  return {
    '--theme-color': palette.base,
    '--theme-color-light': palette.light,
    '--theme-color-lighter': palette.lighter,
    '--theme-color-lightest': palette.lightest,
    '--theme-color-dark': palette.dark,
    '--theme-color-darker': palette.darker,
    '--theme-color-background': palette.background,
    '--theme-color-border': palette.border,
    '--theme-color-hover': palette.hover,
    '--theme-color-active': palette.active,
    '--theme-color-text': palette.text,
  };
}

/**
 * Get color name from hex value (for accessibility)
 */
export function getColorName(hex: string): string {
  const colorNames: Record<string, string> = {
    '#ef4444': 'Red',
    '#f97316': 'Orange',
    '#eab308': 'Yellow',
    '#22c55e': 'Green',
    '#06b6d4': 'Cyan',
    '#3b82f6': 'Blue',
    '#8b5cf6': 'Violet',
    '#ec4899': 'Pink',
    '#f59e0b': 'Amber',
    '#10b981': 'Emerald',
    '#6366f1': 'Indigo',
    '#d946ef': 'Fuchsia',
  };

  return colorNames[hex.toLowerCase()] || hex;
}

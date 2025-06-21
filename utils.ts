// utils.ts

/**
 * Determines whether dark or light text should be used for a given background hex color
 * to ensure good contrast, based on YIQ formula.
 * @param hexcolor The background color in hex format (e.g., "#RRGGBB" or "#RGB").
 * @returns 'dark' if dark text is more suitable, 'light' if light text is more suitable.
 */
export function getContrastYIQ(hexcolor: string): 'dark' | 'light' {
  hexcolor = hexcolor.replace("#", "");
  let r: number, g: number, b: number;

  if (hexcolor.length === 3) {
    r = parseInt(hexcolor.substring(0, 1).repeat(2), 16);
    g = parseInt(hexcolor.substring(1, 2).repeat(2), 16);
    b = parseInt(hexcolor.substring(2, 3).repeat(2), 16);
  } else if (hexcolor.length === 6) {
    r = parseInt(hexcolor.substring(0, 2), 16);
    g = parseInt(hexcolor.substring(2, 4), 16);
    b = parseInt(hexcolor.substring(4, 6), 16);
  } else {
    // Default to dark text for unknown or invalid formats
    return 'dark'; 
  }

  // Calculate YIQ (simplified luminance calculation)
  // Formula: Y = 0.299*R + 0.587*G + 0.114*B
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  // If YIQ is >= 128, the background is light, so use dark text.
  // Otherwise, the background is dark, so use light text.
  return (yiq >= 128) ? 'dark' : 'light';
}

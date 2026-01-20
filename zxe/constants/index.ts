// ZX Spectrum colour palette (0-7)
export const ZX_COLOURS = [
  { name: 'Black', normal: '#000000', bright: '#000000' },
  { name: 'Blue', normal: '#0000D7', bright: '#0000FF' },
  { name: 'Red', normal: '#D70000', bright: '#FF0000' },
  { name: 'Magenta', normal: '#D700D7', bright: '#FF00FF' },
  { name: 'Green', normal: '#00D700', bright: '#00FF00' },
  { name: 'Cyan', normal: '#00D7D7', bright: '#00FFFF' },
  { name: 'Yellow', normal: '#D7D700', bright: '#FFFF00' },
  { name: 'White', normal: '#D7D7D7', bright: '#FFFFFF' },
] as const;

// Default grid size: 7 characters wide x 3 characters tall (each char is 8x8 pixels)
// Max 21 characters total (ZX Spectrum UDG limit)
export const DEFAULT_CHARS_WIDTH = 7;
export const DEFAULT_CHARS_HEIGHT = 3;
export const MAX_UDG_CHARS = 21;
export const CHAR_SIZE = 8; // pixels per character dimension
export const DEFAULT_PIXEL_SIZE = 10; // default display size of each pixel

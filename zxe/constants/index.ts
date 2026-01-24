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

// ZX Spectrum full screen dimensions (for loading/title screens)
export const SCREEN_CHARS_WIDTH = 32;  // 256 pixels
export const SCREEN_CHARS_HEIGHT = 24; // 192 pixels
export const SCREEN_PIXEL_WIDTH = 256;
export const SCREEN_PIXEL_HEIGHT = 192;
export const SCREEN_DISPLAY_SIZE = 6144;    // bytes for pixel data
export const SCREEN_ATTR_SIZE = 768;        // bytes for attributes (32x24)
export const SCREEN_TOTAL_SIZE = 6912;      // total screen memory
export const DEFAULT_SCREEN_PIXEL_SIZE = 3; // smaller zoom for full screen

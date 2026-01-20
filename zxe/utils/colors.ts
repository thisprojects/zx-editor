import { ZX_COLOURS } from '@/constants';

// Get colour hex value
export function getColourHex(colourIndex: number, bright: boolean): string {
  return bright ? ZX_COLOURS[colourIndex].bright : ZX_COLOURS[colourIndex].normal;
}

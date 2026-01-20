export type Tool = 'pencil' | 'line' | 'rubber';

// Attribute byte structure (per 8x8 character cell)
export interface Attribute {
  ink: number;    // 0-7
  paper: number;  // 0-7
  bright: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawBounds {
  minCharX: number;
  minCharY: number;
  maxCharX: number;
  maxCharY: number;
  width: number;
  height: number;
}

export interface ProjectData {
  version: number;
  charsWidth: number;
  charsHeight: number;
  pixels: boolean[][];
  attributes: Attribute[][];
}
